using Microsoft.EntityFrameworkCore;
using TalkClass.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

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
        var feedbacks = app.MapGroup("/api/feedbacks");


        // GET /api/feedbacks  -> lista paginada + filtros
        feedbacks.MapGet("", async (AppDbContext db,
            [FromQuery] string? search,
            [FromQuery] Guid? categoriaId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sort = "desc"
        ) =>
        {
            var qry = db.Feedbacks
                .AsNoTracking()
                .Include(f => f.Categoria)
                .Include(f => f.Respostas)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var like = $"%{search}%";
                qry = qry.Where(f =>
                    EF.Functions.ILike(f.Categoria.Nome, like) ||
                    EF.Functions.ILike(f.CursoOuTurma ?? "", like) ||
                    f.Respostas.Any(r =>
                    r.Tipo == TipoAvaliacao.Texto &&
                    r.ValorTexto != null &&
                    EF.Functions.ILike(r.ValorTexto!, like)
                )
                );
            }

            if (categoriaId.HasValue)
                qry = qry.Where(f => f.CategoriaId == categoriaId.Value);

            qry = (sort?.ToLowerInvariant()) switch
            {
                "asc" => qry.OrderBy(f => f.CriadoEm),
                _ => qry.OrderByDescending(f => f.CriadoEm)
            };

            var total = await qry.CountAsync();

            var items = await qry
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new
                {
                    id = f.Id,
                    criadoEm = f.CriadoEm,
                    categoriaId = f.CategoriaId,
                    categoriaNome = f.Categoria.Nome,
                    cursoOuTurma = f.CursoOuTurma,

                    texto = f.Respostas
                    .Where(r => r.Tipo == TipoAvaliacao.Texto && r.ValorTexto != null)
                    .Select(r => r.ValorTexto!)
                    .OrderBy(x => x)     // qualquer ordenação estável; pode trocar por r.Id se preferir
                    .FirstOrDefault(),

                    resumo = f.Respostas
                    .Where(r => r.Tipo == TipoAvaliacao.Texto && r.ValorTexto != null)
                    .Select(r => r.ValorTexto!.Length <= 140
                        ? r.ValorTexto
                        : r.ValorTexto!.Substring(0, 140) + "…")
                    .OrderBy(x => x)
                    .FirstOrDefault(),

                    qtdRespostas = f.Respostas.Count,

                    notaMedia = f.Respostas
                    .Where(r => r.Tipo == TipoAvaliacao.Nota && r.ValorNota != null)
                    .Select(r => (double)r.ValorNota!)
                    .DefaultIfEmpty()
                    .Average()


                })
                .ToListAsync();

            return Results.Ok(new { items, total });
        });

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
        // POST /api/feedbacks -> grava no banco
        feedbacks.MapPost("", async (NovoFeedback dto, AppDbContext db) =>
 {
     var catOk = await db.Categorias.AsNoTracking()
         .AnyAsync(c => c.Id == dto.categoriaId && c.Ativa);
     if (!catOk) return Results.BadRequest("Categoria inválida ou inativa.");

     var idsPerg = dto.respostas.Select(r => r.perguntaId).Distinct().ToList();
     var idsValidos = await db.Perguntas.AsNoTracking()
         .Where(p => idsPerg.Contains(p.Id) && p.CategoriaId == dto.categoriaId && p.Ativa)
         .Select(p => p.Id).ToListAsync();
     if (idsValidos.Count != idsPerg.Count)
         return Results.BadRequest("Existe pergunta inválida para esta categoria.");

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
         if (!Enum.IsDefined(typeof(TipoAvaliacao), r.tipo))
             return Results.BadRequest($"Tipo inválido na resposta da pergunta {r.perguntaId}.");

         fb.Respostas.Add(new FeedbackResposta
         {
             Id = Guid.NewGuid(),
             PerguntaId = r.perguntaId,
             Tipo = (TipoAvaliacao)r.tipo,
             ValorNota = r.valorNota,   // usado quando tipo = Nota
             ValorBool = r.valorBool,   // usado quando tipo = Sim/Não
             ValorOpcao = r.valorOpcao,  // usado quando tipo = Múltipla escolha
             ValorTexto = r.valorTexto   // usado quando tipo = Texto  <<<< AQUI
         });
     }

     db.Feedbacks.Add(fb);
     await db.SaveChangesAsync();

     return Results.Created($"/api/feedbacks/{fb.Id}", new { id = fb.Id });
 });

        return app;
    }
}
