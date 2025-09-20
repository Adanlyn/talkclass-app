using Microsoft.EntityFrameworkCore;
using TalkClass.Infrastructure.Persistence;

// === IMPORTANTE: namespaces das suas entidades e enum ===
using TalkClass.Domain.Entities;
using TalkClass.Domain.ValueObjects;

namespace TalkClass.API.Endpoints;

// ===== DTOs (fora do método) =====
public record NovaResposta(
    Guid perguntaId,
    int tipo,                 // 0=Nota, 1=SimNao, 2=Multipla, 3=Texto (segue o enum TipoAvaliacao)
    int? valorNota,
    bool? valorBool,
    string? valorOpcao,       // <- string, conforme sua entidade FeedbackResposta
    string? valorTexto
);

public record NovoFeedback(
    Guid categoriaId,
    string? cursoOuTurma,     // <- CursoOuTurma, igual à sua entidade
    List<NovaResposta> respostas
);

public static class FeedbackEndpoints
{
    public static IEndpointRouteBuilder MapFeedbackEndpoints(this IEndpointRouteBuilder app)
    {
        // ===================== CATEGORIAS =====================
        var group = app.MapGroup("/api/categorias");

        // GET /api/categorias/public
        group.MapGet("/public", async (AppDbContext db) =>
        {
            var cats = await db.Categorias
                .AsNoTracking()
                .Where(c => c.Ativa)
                .OrderBy(c => c.Ordem)
                .Select(c => new
                {
                    id = c.Id,
                    nome = c.Nome,
                    descricao = c.Descricao,
                    ordem = c.Ordem
                })
                .ToListAsync();

            return Results.Ok(cats);
        });

        // GET /api/categorias/{id}/perguntas (oficial)
        group.MapGet("/{id:guid}/perguntas", async (Guid id, AppDbContext db) =>
        {
            var perguntas = await db.Perguntas
                .AsNoTracking()
                .Where(p => p.CategoriaId == id && p.Ativa)
                .OrderBy(p => p.Ordem)
                .Select(p => new
                {
                    id = p.Id,
                    enunciado = p.Enunciado,
                    // devolvo como int para casar com o front (TipoAvaliacao enum -> number)
                    tipo = (int)p.Tipo,
                    ordem = p.Ordem,
                    opcoes = p.Opcoes
                        .OrderBy(o => o.Valor)
                        .Select(o => new { id = o.Id, texto = o.Texto, valor = o.Valor })
                        .ToList()
                })
                .ToListAsync();

            return Results.Ok(perguntas);
        });

        // (Opcional) Alias legado: GET /api/categorias/{id}/perguntas/public
        group.MapGet("/{id:guid}/perguntas/public", async (Guid id, AppDbContext db) =>
        {
            var perguntas = await db.Perguntas
                .AsNoTracking()
                .Where(p => p.CategoriaId == id && p.Ativa)
                .OrderBy(p => p.Ordem)
                .Select(p => new
                {
                    id = p.Id,
                    enunciado = p.Enunciado,
                    tipo = (int)p.Tipo,
                    ordem = p.Ordem,
                    opcoes = p.Opcoes
                        .OrderBy(o => o.Valor)
                        .Select(o => new { id = o.Id, texto = o.Texto, valor = o.Valor })
                        .ToList()
                })
                .ToListAsync();

            return Results.Ok(perguntas);
        });

        // ===================== FEEDBACKS =====================
        var feedbacks = app.MapGroup("/api/feedbacks");

        // POST /api/feedbacks -> grava no banco
        feedbacks.MapPost("", async (NovoFeedback dto, AppDbContext db) =>
        {
            // 1) categoria válida e ativa?
            var catOk = await db.Categorias
                .AsNoTracking()
                .AnyAsync(c => c.Id == dto.categoriaId && c.Ativa);
            if (!catOk) return Results.BadRequest("Categoria inválida ou inativa.");

            // 2) perguntas pertencem à categoria e ativas?
            var idsPerg = dto.respostas.Select(r => r.perguntaId).Distinct().ToList();
            var idsValidos = await db.Perguntas
                .AsNoTracking()
                .Where(p => idsPerg.Contains(p.Id) && p.CategoriaId == dto.categoriaId && p.Ativa)
                .Select(p => p.Id)
                .ToListAsync();
            if (idsValidos.Count != idsPerg.Count)
                return Results.BadRequest("Existe pergunta inválida para esta categoria.");

            // 3) monta entidades de acordo com seu modelo
            var fb = new Feedback
            {
                Id = Guid.NewGuid(),
                CategoriaId = dto.categoriaId,
                CursoOuTurma = dto.cursoOuTurma,
                CriadoEm = DateTime.UtcNow,
                Respostas = new List<FeedbackResposta>()
            };

            foreach (var r in dto.respostas)
            {
                // converte int -> enum com validação básica
                if (!Enum.IsDefined(typeof(TipoAvaliacao), r.tipo))
                    return Results.BadRequest($"Tipo inválido na resposta da pergunta {r.perguntaId}.");

                fb.Respostas.Add(new FeedbackResposta
                {
                    Id = Guid.NewGuid(),
                    PerguntaId = r.perguntaId,
                    Tipo = (TipoAvaliacao)r.tipo,
                    ValorNota = r.valorNota,
                    ValorBool = r.valorBool,
                    ValorOpcao = r.valorOpcao, // string
                    ValorTexto = r.valorTexto
                });
            }

            // Persistência
            db.Set<Feedback>().Add(fb); // usa Set<> para não depender do nome do DbSet
            await db.SaveChangesAsync();

            return Results.Created($"/api/feedbacks/{fb.Id}", new { id = fb.Id });
        });

        return app;
    }
}
