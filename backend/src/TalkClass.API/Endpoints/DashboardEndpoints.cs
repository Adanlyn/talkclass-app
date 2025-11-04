using Microsoft.EntityFrameworkCore;
using TalkClass.Infrastructure.Persistence;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;



namespace TalkClass.API.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder api)
    {
        var g = api.MapGroup("/dashboard")
                   .WithTags("Dashboard")
                   .RequireAuthorization();

        // ---- KPIs: NPS, total feedbacks, áreas com alerta, total de áreas
        // assinatura
        g.MapGet("/kpis", async (DateTime? from, DateTime? to, Guid? categoryId, AppDbContext db) =>
        {
            var inicio = from ?? DateTime.UtcNow.Date.AddDays(-30);
            var fim = to ?? DateTime.UtcNow;

            var feedbacksQ = db.Feedbacks.AsNoTracking()
                .Where(f => f.CriadoEm >= inicio && f.CriadoEm <= fim);
            if (categoryId.HasValue) feedbacksQ = feedbacksQ.Where(f => f.CategoriaId == categoryId);

            var totalFeedbacks = await feedbacksQ.CountAsync();

            var notasQ = db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);
            if (categoryId.HasValue) notasQ = notasQ.Where(r => r.Feedback.CategoriaId == categoryId);

            var totalNotas = await notasQ.CountAsync();
            var prom = await notasQ.CountAsync(r => r.ValorNota >= 9);
            var det = await notasQ.CountAsync(r => r.ValorNota <= 6);
            var nps = totalNotas == 0 ? 0 : (int)Math.Round(((prom - det) / (double)totalNotas) * 100);

            // áreas com alerta filtradas pela categoria (se houver)
            var mediasPorAreaQ = db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);
            if (categoryId.HasValue) mediasPorAreaQ = mediasPorAreaQ.Where(r => r.Feedback.CategoriaId == categoryId);

            var mediasPorArea = await mediasPorAreaQ
                .GroupBy(r => new { r.Feedback.CategoriaId, Nome = r.Feedback.Categoria != null ? r.Feedback.Categoria.Nome : "(Sem categoria)" })
                .Select(g => new { g.Key.CategoriaId, g.Key.Nome, Media = g.Average(x => (double)x.ValorNota!) })
                .ToListAsync();
            var areasComAlerta = mediasPorArea.Count(x => x.Media < 3.0);

            var totalAreas = await db.Categorias.AsNoTracking().CountAsync();

            return Results.Ok(new { nps, totalFeedbacks, areasComAlerta, totalAreas });
        });


        // ---- Série temporal: média de notas por dia/semana
        // ---- Série temporal: média de notas por dia/semana (sem DateTrunc)
       api.MapGet("/dashboard/series", async (
    AppDbContext db,
    string interval,
    DateTime from,
    DateTime to,
    Guid? categoryId,
    Guid? categoryId2,
    bool? identified) =>
{
    var q = db.FeedbackRespostas
        .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= from && r.Feedback.CriadoEm <= to);

    if (identified == true)
{
    q = q.Where(r =>
        (!string.IsNullOrEmpty(r.Feedback.NomeIdentificado)) ||
        (!string.IsNullOrEmpty(r.Feedback.ContatoIdentificado))
    );
}

    if (categoryId.HasValue)
        q = q.Where(r => r.Feedback.CategoriaId == categoryId.Value);

    if (categoryId2.HasValue)
        q = q.Where(r => r.Feedback.CategoriaId == categoryId2.Value);

    // materializa só o que precisamos
    var rows = await q
        .Select(r => new { r.ValorNota, r.Feedback.CriadoEm })
        .AsNoTracking()
        .ToListAsync();

    DateTime Bucket(DateTime dt) => interval switch
    {
        "week"  => dt.Date.AddDays(-(((int)dt.DayOfWeek + 6) % 7)), // segunda
        "month" => new DateTime(dt.Year, dt.Month, 1),
        _       => dt.Date
    };

    var grouped = rows.GroupBy(r => Bucket(r.CriadoEm))
        .OrderBy(g => g.Key)
        .Select(g =>
        {
            var notas = g.Where(x => x.ValorNota.HasValue).Select(x => (double)x.ValorNota!.Value).ToList();
            var media = notas.Count > 0 ? notas.Average() : 0.0;   // <- proteção
            return new { bucket = g.Key, media, count = g.Count() };
        })
        .ToList();

    return Results.Ok(grouped);
});

        // ---- Distribuição de notas (1..10)
        g.MapGet("/distribution", async (DateTime? from, DateTime? to, Guid? categoryId, AppDbContext db) =>
     {
         var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
         var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

         var q = db.FeedbackRespostas.AsNoTracking()
             .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);
         if (categoryId.HasValue)
             q = q.Where(r => r.Feedback.CategoriaId == categoryId.Value);

         var bins = await q.GroupBy(r => r.ValorNota!.Value)
             .Select(g => new { rating = g.Key, total = g.Count() })
             .OrderBy(x => x.rating)
             .ToListAsync();

         return Results.Ok(bins);
     });

        // ---- Top áreas (piores médias primeiro + nº de alertas)
        g.MapGet("/top-areas", async (int? limit, DateTime? from, DateTime? to, AppDbContext db) =>
{
    var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
    var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
    int take = limit is > 0 ? limit!.Value : 10;

    var data = await db.FeedbackRespostas.AsNoTracking()
        .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
        .Select(r => new { r.ValorNota, r.Feedback.CategoriaId, r.Feedback.Categoria.Nome })
        .GroupBy(x => new { x.CategoriaId, x.Nome })
        .Select(g => new
        {
            categoryId = g.Key.CategoriaId,
            area = g.Key.Nome,
            media = g.Average(x => (double)x.ValorNota!),
            alertas = g.Count(x => x.ValorNota! <= 3)
        })
        .OrderBy(x => x.media)
        .ThenByDescending(x => x.alertas)
        .Take(take)
        .ToListAsync();

    return Results.Ok(data);
});

        g.MapGet("/kpis-ira", async (DateTime? from, DateTime? to, AppDbContext db) =>
 {
     var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
     var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

     var respostas = await db.FeedbackRespostas.AsNoTracking()
         .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
         .Select(r => new { Nota = r.ValorNota, Texto = r.ValorTexto })
         .ToListAsync();

     if (respostas.Count == 0) return Results.Ok(new { ira = 0.0 });

     // pesos (pode ajustar depois)
     const double wK = 0.4; // palavras críticas
     const double wN = 0.6; // nota invertida
     const double W = wK + wN;

     double ScoreItem(int? nota, string? texto)
     {
         // nota normalizada 0..1 (se não tiver, usa 0.5)
         var n = nota.HasValue ? Math.Clamp(nota.Value, 0, 10) / 10.0 : 0.5;
         var invN = 1 - n; // quanto maior, pior

         // checagem de palavras críticas no ValorTexto
         bool hasKw = false;
         if (!string.IsNullOrWhiteSpace(texto))
         {
             var clean = RemoveDiacritics(texto.ToLowerInvariant());
             foreach (var tok in TokenSplit.Split(clean))
             {
                 var t = tok.Trim();
                 if (t.Length < 3) continue;
                 if (CriticalWords.Contains(t)) { hasKw = true; break; }
             }
         }

         var kw = hasKw ? 1.0 : 0.0;
         var ira01 = (wK * kw + wN * invN) / W; // 0..1
         return ira01 * 100.0;                  // 0..100
     }

     var ira = Math.Round(respostas.Average(x => ScoreItem(x.Nota, x.Texto)), 1);
     return Results.Ok(new { ira });
 });


        g.MapGet("/kpis-negativos", async (AppDbContext db) =>
 {
     var fim = DateTime.UtcNow;
     var d7 = fim.AddDays(-7);
     var d30 = fim.AddDays(-30);

     var rows = await db.FeedbackRespostas.AsNoTracking()
         .Select(r => new { r.ValorNota, r.Feedback.CriadoEm })
         .ToListAsync();

     var s7 = rows.Where(x => x.CriadoEm >= d7).ToList();
     var s30 = rows.Where(x => x.CriadoEm >= d30).ToList();

     double pct7 = s7.Count == 0 ? 0 : Math.Round(100.0 * s7.Count(x => x.ValorNota.HasValue && x.ValorNota <= 6) / s7.Count, 1);
     double pct30 = s30.Count == 0 ? 0 : Math.Round(100.0 * s30.Count(x => x.ValorNota.HasValue && x.ValorNota <= 6) / s30.Count, 1);

     return Results.Ok(new { pct7, pct30 });
 });


        g.MapGet("/kpis-cobertura", async (DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var inicio = from ?? DateTime.UtcNow.Date.AddDays(-30);
            var fim = to ?? DateTime.UtcNow;

            int feedbacks = await db.Feedbacks.AsNoTracking()
                .CountAsync(f => f.CriadoEm >= inicio && f.CriadoEm <= fim);

            int? totalAlunos = null; // TODO: puxar de tabela 'turma' ou config
            double? cobertura = totalAlunos.HasValue && totalAlunos.Value > 0
                ? Math.Round(100.0 * feedbacks / totalAlunos.Value, 1)
                : null;

            return Results.Ok(new { feedbacks, totalAlunos, cobertura });
        });

        g.MapGet("/kpis-topico-critico", async (DateTime? to, AppDbContext db) =>
        {
            var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
            var w0ini = fim.AddDays(-7).Date;   // semana atual
            var w1ini = fim.AddDays(-14).Date;  // semana anterior

            var rows = await db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= w1ini && r.Feedback.CriadoEm <= fim)
                .Select(r => new
                {
                    Cat = r.Feedback.Categoria != null ? r.Feedback.Categoria.Nome : "(Sem categoria)",
                    Dt = r.Feedback.CriadoEm
                })
                .ToListAsync();

            var w0 = rows.Where(x => x.Dt >= w0ini);
            var w1 = rows.Where(x => x.Dt < w0ini);

            var grup = (from x in rows
                        group x by x.Cat into g
                        let c0 = w0.Count(z => z.Cat == g.Key)
                        let c1 = w1.Count(z => z.Cat == g.Key)
                        where (c0 + c1) >= 20                     // mínimo 20 menções
                        let growth = c1 == 0 ? (c0 > 0 ? double.PositiveInfinity : 0) : (c0 - c1) / (double)c1
                        orderby growth descending
                        select new { topico = g.Key, c0, c1, growth }).FirstOrDefault();

            return Results.Ok(grup ?? new { topico = "—", c0 = 0, c1 = 0, growth = 0.0 });
        });

        g.MapGet("/question-series", async (Guid questionId, string? interval, DateTime? from, DateTime? to, AppDbContext db) =>
{
    var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-84)).Date;
    var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
    var step = (interval ?? "week").ToLowerInvariant(); // day|week|month

    var rows = await db.FeedbackRespostas.AsNoTracking()
        .Where(r => r.PerguntaId == questionId && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
        .Select(r => new { r.ValorNota, r.Feedback.CriadoEm })
        .ToListAsync();

    IEnumerable<IGrouping<DateTime, dynamic>> groups = step switch
    {
        "day" => rows.GroupBy(x => x.CriadoEm.Date),
        "month" => rows.GroupBy(x => new DateTime(x.CriadoEm.Year, x.CriadoEm.Month, 1)),
        _ => rows.GroupBy(x => WeekBucket(x.CriadoEm))
    };

    var data = groups.OrderBy(g => g.Key).Select(g =>
    {
        var tot = g.Count();
        var media = g.Where(x => x.ValorNota.HasValue).Select(x => (double)x.ValorNota!).DefaultIfEmpty().Average();
        var neg = tot == 0 ? 0.0 : Math.Round(100.0 * g.Count(x => x.ValorNota.HasValue && x.ValorNota <= 6) / tot, 1);
        return new
        {
            bucket = g.Key.ToString("yyyy-MM-dd"),
            avg = Math.Round(media, 2),
            neg
        };
    });

    return Results.Ok(data);
});

       api.MapGet("/dashboard/topics-heatmap", async (
    AppDbContext db,
    DateTime from,
    DateTime to,
    Guid? categoryId,
    int? limit) =>
{
    var lim = limit.GetValueOrDefault(6);

    var baseQ = db.FeedbackRespostas
        .Where(r => r.Feedback.CriadoEm >= from && r.Feedback.CriadoEm <= to)
        .Where(r => r.ValorTexto != null || r.ValorNota != null);

    if (categoryId.HasValue)
        baseQ = baseQ.Where(r => r.Feedback.CategoriaId == categoryId.Value);

    // Seleciona tópico (enunciado) + data
    var itens = await baseQ
        .Where(r => r.Pergunta != null) // proteção
        .Select(r => new { Titulo = r.Pergunta!.Enunciado, Data = r.Feedback.CriadoEm })
        .AsNoTracking()
        .ToListAsync();

    if (itens.Count == 0)
        return Results.Ok(new { labels = Array.Empty<string>(), series = Array.Empty<object>() });

    DateTime WeekBucket(DateTime d) => d.Date.AddDays(-(((int)d.DayOfWeek + 6) % 7)); // segunda

    // top N tópicos por volume
    var topTopics = itens
        .GroupBy(x => x.Titulo ?? "(Sem título)")
        .OrderByDescending(g => g.Count())
        .Take(lim)
        .Select(g => g.Key)
        .ToList();

    var semanas = itens
        .Select(x => WeekBucket(x.Data))
        .Distinct()
        .OrderBy(x => x)
        .ToList();

    var labels = semanas.Select(s => s.ToString("yyyy-MM-dd")).ToList();

    var series = topTopics.Select(topic =>
    {
        var porSemana = itens.Where(i => (i.Titulo ?? "(Sem título)") == topic)
                             .GroupBy(i => WeekBucket(i.Data))
                             .ToDictionary(g => g.Key, g => g.Count());

        var data = semanas.Select(s => porSemana.TryGetValue(s, out var c) ? c : 0).ToList();
        return new { name = topic, data };
    }).ToList();

    return Results.Ok(new { labels, series });
});


        g.MapGet("/topics-polarity", async (DateTime? from, DateTime? to, Guid? categoryId, AppDbContext db) =>
  {
      var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
      var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

      var q = db.FeedbackRespostas.AsNoTracking()
          .Where(r => r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);

      if (categoryId.HasValue)
          q = q.Where(r => r.Feedback.CategoriaId == categoryId.Value);

      var rows = await q.Select(r => new { Topico = r.Pergunta.Enunciado, Nota = r.ValorNota }).ToListAsync();

      bool Neg(int? n) => n.HasValue && n <= 6;
      bool Pos(int? n) => n.HasValue && n >= 9;

      var data = rows
          .GroupBy(x => x.Topico)
          .Select(g =>
          {
              int tot = g.Count();
              int neg = g.Count(x => Neg(x.Nota));
              int pos = g.Count(x => Pos(x.Nota));
              int neu = tot - neg - pos;
              double pneg = tot == 0 ? 0 : (100.0 * neg / tot);
              return new { topic = g.Key, neg, neu, pos, pneg };
          })
          .OrderByDescending(x => x.pneg)
          .ToList();

      return Results.Ok(data);
  });


        g.MapGet("/boxplot-notas", async (string groupBy, DateTime? from, DateTime? to, Guid? categoryId, AppDbContext db) =>
 {
     var gb = (groupBy ?? "curso").ToLowerInvariant();
     if (gb != "curso")
         return Results.BadRequest(new { error = "groupBy aceita apenas 'curso' (CursoOuTurma) no momento." });

     var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
     var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

     var q = db.FeedbackRespostas.AsNoTracking()
         .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);

     if (categoryId.HasValue)
         q = q.Where(r => r.Feedback.CategoriaId == categoryId.Value);

     var data = await q
         .Select(r => new { Grupo = r.Feedback.CursoOuTurma ?? "(Sem curso/turma)", Nota = (double)r.ValorNota! })
         .GroupBy(x => x.Grupo)
         .Select(g => new { group = g.Key, notas = g.Select(v => v.Nota).ToList() })
         .ToListAsync();

     static (double q1, double q2, double q3, double min, double max, double[] outliers) Box(List<double> v)
     {
         var a = v.OrderBy(x => x).ToArray();
         if (a.Length == 0) return (0, 0, 0, 0, 0, Array.Empty<double>());
         double P(double p) { var i = (a.Length - 1) * p; var lo = (int)Math.Floor(i); var hi = (int)Math.Ceiling(i); return lo == hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (i - lo); }
         var q1 = P(0.25); var q2 = P(0.5); var q3 = P(0.75); var iqr = q3 - q1; var lo = q1 - 1.5 * iqr; var hi = q3 + 1.5 * iqr;
         var outs = a.Where(x => x < lo || x > hi).ToArray();
         var min = a.Where(x => x >= lo).DefaultIfEmpty(a.First()).Min();
         var max = a.Where(x => x <= hi).DefaultIfEmpty(a.Last()).Max();
         return (q1, q2, q3, min, max, outs);
     }

     var result = data.Select(d =>
     {
         var b = Box(d.notas);
         return new { d.group, q1 = Math.Round(b.q1, 2), median = Math.Round(b.q2, 2), q3 = Math.Round(b.q3, 2), min = Math.Round(b.min, 2), max = Math.Round(b.max, 2), outliers = b.outliers };
     });

     return Results.Ok(result);
 });



        g.MapGet("/wordcloud", async (string polarity, DateTime? from, DateTime? to, Guid? categoryId, int? limit, int? minLen, AppDbContext db) =>
 {
     var pol = (polarity ?? "neg").ToLowerInvariant(); // "pos"|"neg"
     var inicio = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
     var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
     int topN = limit is > 0 ? limit!.Value : 200;
     int minL = minLen is > 0 ? minLen!.Value : 3;

     var baseQ = db.FeedbackRespostas.AsNoTracking()
         .Where(r => r.ValorTexto != null && r.ValorTexto != "" && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim);

     if (categoryId.HasValue)
         baseQ = baseQ.Where(r => r.Feedback.CategoriaId == categoryId.Value);

     // filtro simples por nota: neg <=6 | pos >=9 (quando houver)
     if (pol == "neg")
         baseQ = baseQ.Where(r => r.ValorNota != null && r.ValorNota <= 6);
     else
         baseQ = baseQ.Where(r => r.ValorNota != null && r.ValorNota >= 9);

     var textos = await baseQ.Select(r => r.ValorTexto!).ToListAsync();

     var tokens = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
     foreach (var phrase in textos)
     {
         var text = RemoveDiacritics(phrase.ToLowerInvariant());
         foreach (var raw in TokenSplit.Split(text))
         {
             var w = raw.Trim();
             if (w.Length < minL) continue;
             if (Stopwords.Contains(w)) continue;
             if (int.TryParse(w, out _)) continue;

             tokens[w] = tokens.TryGetValue(w, out var c) ? c + 1 : 1;
         }
     }

     var result = tokens.OrderByDescending(kv => kv.Value).Take(topN)
         .Select(kv => new { word = kv.Key, count = kv.Value });

     return Results.Ok(result);
 });

        // 1) NPS por período (para o gráfico "NPS (tendência)")
        g.MapGet("/nps-series", async (string? interval, DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var step = (interval ?? "week").ToLowerInvariant(); // day|week|month
            var inicio = (from ?? DateTime.UtcNow.AddDays(-84)).Date;
            var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

            var rows = await db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
                .Select(r => new { Nota = r.ValorNota!.Value, Dt = r.Feedback.CriadoEm })
                .ToListAsync();

            IEnumerable<IGrouping<DateTime, dynamic>> groups = step switch
            {
                "day" => rows.GroupBy(x => x.Dt.Date),
                "month" => rows.GroupBy(x => new DateTime(x.Dt.Year, x.Dt.Month, 1)),
                _ => rows.GroupBy(x => WeekBucket(x.Dt))
            };

            var data = groups.OrderBy(g => g.Key).Select(g =>
            {
                var tot = g.Count();
                var prom = g.Count(x => x.Nota >= 9);
                var det = g.Count(x => x.Nota <= 6);
                var nps = tot == 0 ? 0 : (int)Math.Round(((prom - det) / (double)tot) * 100);
                return new { bucket = g.Key.ToString("yyyy-MM-dd"), nps };
            });

            return Results.Ok(data);
        });

        // 2) Volume de feedbacks por dia (para "Volume de feedbacks")
        g.MapGet("/volume-series", async (string? interval, DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var step = (interval ?? "day").ToLowerInvariant(); // day|week|month
            var inicio = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
            var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

            var rows = await db.Feedbacks.AsNoTracking()
                .Where(f => f.CriadoEm >= inicio && f.CriadoEm <= fim)
                .Select(f => f.CriadoEm)
                .ToListAsync();

            IEnumerable<IGrouping<DateTime, DateTime>> groups = step switch
            {
                "week" => rows.GroupBy(x => WeekBucket(x)),
                "month" => rows.GroupBy(x => new DateTime(x.Year, x.Month, 1)),
                _ => rows.GroupBy(x => x.Date)
            };

            var data = groups.OrderBy(g => g.Key)
                             .Select(g => new { bucket = g.Key.ToString("yyyy-MM-dd"), total = g.Count() });

            return Results.Ok(data);
        });

        // 3) Alertas por área (para "Alertas por área")
        g.MapGet("/areas-alerts", async (int? limit, DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var inicio = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
            var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);
            int take = limit is > 0 ? limit!.Value : 8;

            var data = await db.FeedbackRespostas.AsNoTracking()
                .Where(r => r.ValorNota != null && r.Feedback.CriadoEm >= inicio && r.Feedback.CriadoEm <= fim)
                .Select(r => new { r.ValorNota, r.Feedback.CategoriaId, Area = r.Feedback.Categoria != null ? r.Feedback.Categoria.Nome : "(Sem categoria)" })
                .GroupBy(x => new { x.CategoriaId, x.Area })
                .Select(g => new
                {
                    area = g.Key.Area,
                    crit = g.Count(x => x.ValorNota! <= 3),
                    ok = g.Count(x => x.ValorNota! >= 4)
                })
                .OrderByDescending(x => x.crit)
                .Take(take)
                .ToListAsync();

            return Results.Ok(data);
        });

        // 4) Horários 00..23 (para "Participação por horário")
        g.MapGet("/hourly", async (DateTime? from, DateTime? to, AppDbContext db) =>
        {
            var inicio = (from ?? DateTime.UtcNow.AddDays(-30)).Date;
            var fim = (to ?? DateTime.UtcNow).Date.AddDays(1).AddTicks(-1);

            var rows = await db.Feedbacks.AsNoTracking()
                .Where(f => f.CriadoEm >= inicio && f.CriadoEm <= fim)
                .Select(f => f.CriadoEm.Hour)
                .ToListAsync();

            var data = Enumerable.Range(0, 24)
                .Select(h => new { hour = h, total = rows.Count(x => x == h) });

            return Results.Ok(data);
        });

        // 5) Piores perguntas (para "Piores perguntas – Top 5")
// 5) Piores perguntas (Top 5) — compatível com from/to e inicio/fim
g.MapGet("/questions-worst", async (
    AppDbContext db,
    // Nomes novos (frontend): from/to
    DateTime? from,
    DateTime? to,
    // Nomes antigos (se algum lugar ainda chamar): inicio/fim
    DateTime? inicio,
    DateTime? fim,
    Guid? categoryId,
    int? limit) =>
{
    // Resolver intervalo aceitando qualquer combinação
 // Calcula intervalo e normaliza para UTC (não misturar Kinds)
var startLocal = (from ?? inicio ?? DateTime.UtcNow.AddDays(-30));
var endLocal   = (to   ?? fim    ?? DateTime.UtcNow);

var start = AsUtc(startLocal.Date);                             // 00:00 UTC do dia
var end   = AsUtc(endLocal.Date.AddDays(1).AddTicks(-1));       // 23:59:59.9999999 UTC do dia

    var take  = (limit is > 0 ? limit!.Value : 5);

    var data = await db.FeedbackRespostas.AsNoTracking()
        .Where(r => r.ValorNota != null &&
                    r.Feedback.CriadoEm >= start &&
                    r.Feedback.CriadoEm <= end &&
                    (!categoryId.HasValue || r.Feedback.CategoriaId == categoryId))
        .GroupBy(r => new { r.PerguntaId, r.Pergunta.Enunciado })
        .Select(g => new
        {
            questionId = g.Key.PerguntaId,
            pergunta   = g.Key.Enunciado,
            media      = g.Average(x => (double)x.ValorNota!)
        })
        .OrderBy(x => x.media) // piores primeiro
        .Take(take)
        .ToListAsync();

    return Results.Ok(data);
});

        return api;
    }

    // ===== Helpers globais (nível de classe) =====
    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
{
    "a","o","os","as","de","da","do","das","dos","e","é","em","no","na","nos","nas","um","uma","uns","umas",
    "para","por","com","sem","ao","à","aos","às","que","se","ser","tem","têm","ter","foi","era","são","está",
    "estão","como","mais","menos","muito","muita","muitos","muitas","pouco","pouca","poucos","poucas","já",
    "também","entre","até","quando","onde","porque","pois","per","sobre","sob","lhe","lhes","me","te","vai",
    "depois","antes","agora","hoje","ontem","amanhã","pra","pro","q","pq","vc","vcs","ok","bom","boa","ruim"
};



    private static readonly Regex TokenSplit = new(@"[^a-zà-ú0-9]+", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static string RemoveDiacritics(string text)
    {
        return string.Concat(text.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark))
            .Normalize(NormalizationForm.FormC);
    }

    // Auxiliares de bucket de data
    // Normaliza qualquer DateTime para UTC (evita mix de Kinds)
private static DateTime AsUtc(DateTime dt)
    => dt.Kind switch
    {
        DateTimeKind.Utc   => dt,
        DateTimeKind.Local => dt.ToUniversalTime(),
        _                  => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
    };

    private static DateTime WeekBucket(DateTime dt) => dt.Date.AddDays(-(int)dt.Date.DayOfWeek).Date;

    private static readonly HashSet<string> CriticalWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "ruim", "péssimo", "horrível", "terrível", "insuportável", "inaceitável",
        "ódio", "detesto", "pior", "decepcionante", "frustrante", "lamentável",
        "problema", "erro", "falha", "bug", "defeito", "complicado",
        "difícil", "demorado", "atraso", "insuportável", "inaceitável",
        "reclamação", "reclamar", "insatisfação", "insatisfeito",
        "cancelar", "cancelamento", "deixar", "abandono"
    };

}
