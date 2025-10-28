using Microsoft.EntityFrameworkCore;
using TalkClass.Infrastructure.Persistence;
using System.Globalization;


namespace TalkClass.API.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder api)
    {
        var g = api.MapGroup("/dashboard")
                   .WithTags("Dashboard")
                   .RequireAuthorization();

        // ---- KPIs: NPS, total feedbacks, áreas com alerta, total de áreas
        g.MapGet("/kpis", async (DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var inicio = from ?? DateTime.UtcNow.Date.AddDays(-30);
            var fim = to ?? DateTime.UtcNow;

            // total de formulários submetidos no período
            var totalFeedbacks = await db.Feedbacks.AsNoTracking()
                .Where(f => f.CriadoEm >= inicio && f.CriadoEm <= fim)
                .CountAsync();

            // NPS baseado apenas nas respostas de nota
            var notasQ = db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null)
                .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);

            var totalNotas = await notasQ.CountAsync();
            var prom = await notasQ.CountAsync(r => r.ValorNota >= 9);
            var det = await notasQ.CountAsync(r => r.ValorNota <= 6);
            var nps = totalNotas == 0 ? 0 : (int)Math.Round(((prom - det) / (double)totalNotas) * 100);

            // Áreas com alerta: média de notas < 3.0 no período
            var mediasPorArea = await db.FeedbackRespostas.AsNoTracking()
    .Where(r => r.ValorNota != null)
    .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
    .GroupBy(r => new
    {
        r.Feedback.CategoriaId, // pode ser null
        Nome = r.Feedback.Categoria != null ? r.Feedback.Categoria.Nome : "(Sem categoria)"
    })
    .Select(g => new
    {
        g.Key.CategoriaId,
        g.Key.Nome,
        Media = g.Average(x => (double)x.ValorNota!)
    })
    .ToListAsync();

            var areasComAlerta = mediasPorArea.Count(x => x.Media < 3.0);

            var totalAreas = await db.Categorias.AsNoTracking().CountAsync();

            return Results.Ok(new
            {
                nps,
                totalFeedbacks,
                areasComAlerta,
                totalAreas
            });
        });

        // ---- Série temporal: média de notas por dia/semana
        // ---- Série temporal: média de notas por dia/semana (sem DateTrunc)
        g.MapGet("/series", async (Guid? categoryId, string? interval, DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-84)).Date;
            var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1); // fim do dia
            var step = (interval ?? "week").ToLowerInvariant();

            var baseQ = db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null)
                .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);

            if (categoryId.HasValue)
                baseQ = baseQ.Where(r => r.Feedback.CategoriaId == categoryId.Value);

            // Traz só o necessário e agrupa em memória (evita Npgsql DateTrunc)
            var rows = await baseQ
                .Select(r => new { r.ValorNota, r.Feedback.CriadoEm })
                .ToListAsync();

            IEnumerable<(DateTime bucket, double avg, int count)> agregados;

            if (step == "day")
            {
                agregados = rows
                    .GroupBy(x => x.CriadoEm.Date)
                    .Select(g => (g.Key, g.Average(v => (double)v.ValorNota!), g.Count()))
                    .OrderBy(t => t.Key);
            }
            else
            {
                // semana ISO: usamos ISOWeek para (ano, semana) e normalizamos para a 2ªf (Monday)
                DateTime MondayOfIsoWeek(int year, int week)
                {
                    var thursday = ISOWeek.ToDateTime(year, week, DayOfWeek.Thursday);
                    // volta para Monday
                    return thursday.AddDays(-(int)thursday.DayOfWeek + (int)DayOfWeek.Monday).Date;
                }

                agregados = rows
                    .GroupBy(x =>
                    {
                        var (yr, wk) = (ISOWeek.GetYear(x.CriadoEm), ISOWeek.GetWeekOfYear(x.CriadoEm));
                        return MondayOfIsoWeek(yr, wk);
                    })
                    .Select(g => (g.Key, g.Average(v => (double)v.ValorNota!), g.Count()))
                    .OrderBy(t => t.Key);
            }

            var data = agregados.Select(t => new
            {
                bucket = step == "day"
                    ? t.bucket.ToString("yyyy-MM-dd")
                    : $"{t.bucket:yyyy}-W{ISOWeek.GetWeekOfYear(t.bucket):00}",
                avg = t.avg,
                count = t.count
            });

            return Results.Ok(data);
        });


        // ---- Distribuição de notas (1..10)
        g.MapGet("/distribution", async (DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var inicio = from ?? DateTime.UtcNow.Date.AddDays(-30);
            var fim = to ?? DateTime.UtcNow;

            var hist = await db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null)
                .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
                .GroupBy(r => r.ValorNota!)
                .Select(g => new { rating = g.Key, total = g.Count() })
                .ToListAsync();

            var bins = Enumerable.Range(1, 10)
                .Select(n => new { rating = n, total = hist.FirstOrDefault(h => h.rating == n)?.total ?? 0 })
                .OrderBy(x => x.rating);

            return Results.Ok(bins);
        });

        // ---- Top áreas (piores médias primeiro + nº de alertas)
        g.MapGet("/top-areas", async (int limit, DateTime? from, DateTime? to, AppDbContext db) =>
{
    var l = limit <= 0 ? 5 : Math.Min(limit, 20);
    var inicio = from ?? DateTime.UtcNow.Date.AddDays(-30);
    var fim    = to   ?? DateTime.UtcNow;

    var data = await db.FeedbackRespostas.AsNoTracking()
        .Where(r => r.ValorNota != null)
        .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
        .GroupBy(r => new {
            r.Feedback.CategoriaId, // pode ser null
            Nome = r.Feedback.Categoria != null ? r.Feedback.Categoria.Nome : "(Sem categoria)"
        })
        .Select(g => new
        {
            categoryId = g.Key.CategoriaId,      // Guid? (ou null)
            area       = g.Key.Nome,
            media      = g.Average(x => (double)x.ValorNota!),
            alertas    = g.Count(x => x.ValorNota! <= 3)
        })
        .OrderBy(x => x.media)                  // piores primeiro
        .ThenByDescending(x => x.alertas)
        .Take(l)
        .ToListAsync();

    return Results.Ok(data);
});


        return api;
    }
}
