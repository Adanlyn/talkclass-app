using Microsoft.EntityFrameworkCore;
using TalkClass.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

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
    string? cursoOuTurma,
    string? nomeIdentificado,
    string? contatoIdentificado,
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
                    [FromQuery] string? sort = "desc",
                    [FromQuery] string? courseName = null,
                    [FromQuery] bool? identified = null,
                    [FromQuery] string? dateStart = null,
                    [FromQuery] string? dateEnd = null
                ) =>
                {
                    var qry = db.Feedbacks
                        .AsNoTracking()
                        .Include(f => f.Categoria)
                        .Include(f => f.Respostas)
                        .AsQueryable();

                    // --- Período (YYYY-MM-DD) -> UTC inclusivo ---
                    DateTime? startUtc = null, endUtc = null;
                    if (!string.IsNullOrWhiteSpace(dateStart) &&
                        DateTime.TryParse(dateStart, out var dStart))
                    {
                        startUtc = DateTime.SpecifyKind(dStart.Date, DateTimeKind.Utc);
                    }
                    if (!string.IsNullOrWhiteSpace(dateEnd) &&
                        DateTime.TryParse(dateEnd, out var dEnd))
                    {
                        endUtc = DateTime.SpecifyKind(dEnd.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                    }

                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        var like = $"%{search}%";
                        qry = qry.Where(f =>
                            EF.Functions.ILike(f.Categoria.Nome, like) ||
                            EF.Functions.ILike(f.CursoOuTurma ?? "", like) ||
                            EF.Functions.ILike(f.NomeIdentificado ?? "", like) ||
                            EF.Functions.ILike(f.ContatoIdentificado ?? "", like) ||
                            f.Respostas.Any(r =>
                            r.Tipo == TipoAvaliacao.Texto &&
                            r.ValorTexto != null &&
                            EF.Functions.ILike(r.ValorTexto!, like)
                        )
                        );
                    }

                    if (categoriaId.HasValue)
                        qry = qry.Where(f => f.CategoriaId == categoriaId.Value);

                    if (startUtc.HasValue)
                        qry = qry.Where(f => f.CriadoEm >= startUtc.Value);
                    if (endUtc.HasValue)
                        qry = qry.Where(f => f.CriadoEm <= endUtc.Value);

                    // curso (contém)
                    if (!string.IsNullOrWhiteSpace(courseName))
                    {
                        var likeCurso = $"%{courseName}%";
                        qry = qry.Where(f => EF.Functions.ILike(f.CursoOuTurma ?? "", likeCurso));
                    }

                    // identificado: true = só identificados, false = só anônimos
                    if (identified.HasValue)
                    {
                        if (identified.Value)
                            qry = qry.Where(f => f.NomeIdentificado != null || f.ContatoIdentificado != null);
                        else
                            qry = qry.Where(f => f.NomeIdentificado == null && f.ContatoIdentificado == null);
                    }

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
                            identificado = (f.NomeIdentificado != null || f.ContatoIdentificado != null),
                            nomeIdentificado = f.NomeIdentificado,
                            contatoIdentificado = f.ContatoIdentificado,
                            texto = f.Respostas
                            .Where(r => r.Tipo == TipoAvaliacao.Texto && r.ValorTexto != null)
                            .Select(r => r.ValorTexto!)
                            .OrderBy(x => x)
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

        // GET /api/feedbacks/{id} -> detalhe para o "Ver mais"
        feedbacks.MapGet("/{id:guid}", async ([FromRoute] Guid id, AppDbContext db) =>
        {
            string? MapOpcao(string? valor)
            {
                if (string.IsNullOrWhiteSpace(valor)) return null;
                var v = valor.Trim();
                if (Regex.IsMatch(v, @"^\++$")) return v.Length.ToString();
                var up = v.ToUpperInvariant();
                if (up is "S" or "SIM" or "TRUE" or "1") return "Sim";
                if (up is "N" or "NAO" or "NÃO" or "FALSE" or "0") return "Não";
                return v; // mantém o label como veio
            }
            var f = await db.Feedbacks
                .AsNoTracking()
                .Include(x => x.Categoria)
                .Include(x => x.Respostas)
                    .ThenInclude(r => r.Pergunta)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (f is null) return Results.NotFound();

            var dto = new
            {
                id = f.Id,
                criadoEm = f.CriadoEm,
                categoria = f.Categoria.Nome,
                curso = f.CursoOuTurma,
                identificado = (f.NomeIdentificado != null || f.ContatoIdentificado != null),
                nome = f.NomeIdentificado,
                contato = f.ContatoIdentificado,
                notaMedia = f.Respostas
                    .Where(r => r.Tipo == TipoAvaliacao.Nota && r.ValorNota != null)
                    .Select(r => (double)r.ValorNota!)
                    .DefaultIfEmpty()
                    .Average(),
                respostas = f.Respostas
                   .Where(r =>
        r.ValorNota != null ||
        !string.IsNullOrWhiteSpace(r.ValorTexto) ||
        !string.IsNullOrWhiteSpace(r.ValorOpcao))
    // (opcional) se sua entidade Pergunta tiver um campo de ordenação, use OrderBy aqui
    //.OrderBy(r => r.Pergunta.Ordem)
    .Select(r => new
    {
        tipo = r.Tipo.ToString(),
        pergunta = r.Pergunta != null ? r.Pergunta.Enunciado : null, // troque para .Texto se esse for o nome no seu modelo
        nota = r.ValorNota,
        texto = string.IsNullOrWhiteSpace(r.ValorTexto) ? null : r.ValorTexto!.Trim(),
        // “opção” amigável: +++ -> 3, S/N -> Sim/Não, senão mantém o label
        opcao = MapOpcao(r.ValorOpcao)
    })

            };

            return Results.Ok(dto);
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
         NomeIdentificado = string.IsNullOrWhiteSpace(dto.nomeIdentificado) ? null : dto.nomeIdentificado.Trim(),
         ContatoIdentificado = string.IsNullOrWhiteSpace(dto.contatoIdentificado) ? null : dto.contatoIdentificado.Trim(),
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
