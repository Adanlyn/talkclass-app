using Microsoft.EntityFrameworkCore;
using TalkClass.Domain.Entities;
using TalkClass.Infrastructure.Persistence;

namespace TalkClass.API.Endpoints;

public record CreateCategoryRequest(string Nome, string? Descricao);
public record UpdateCategoryRequest(string Nome, string? Descricao, int? Ordem);
public record ToggleCategoryStatusRequest(bool Ativa);

public static class CategoriesEndpoints
{
    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {

        app.MapGet("/api/categories/public", async (AppDbContext db) =>
{
    var cats = await db.Categorias
        .AsNoTracking()
        .Where(c => c.Ativa)
        .OrderBy(c => c.Ordem).ThenBy(c => c.Nome)
        .Select(c => new
        {
            id = c.Id,
            nome = c.Nome
        })
        .ToListAsync();

    return Results.Ok(cats);
})
.WithTags("Categories");

        var group = app.MapGroup("/api/categories")
                       .WithTags("Categories")
                       .RequireAuthorization(); // protege tudo (ajuste se quiser GET público)

        // GET /api/categories?search=&page=1&pageSize=20&onlyActive=true
        group.MapGet("", async (
            [AsParameters] QueryParams qp,
            AppDbContext db) =>
        {
            var q = db.Categorias.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(qp.search))
                q = q.Where(c => EF.Functions.ILike(c.Nome, $"%{qp.search}%"));

            if (qp.onlyActive is true)
                q = q.Where(c => c.Ativa);

            var total = await q.CountAsync();
            var items = await q.OrderBy(c => c.Ordem).ThenBy(c => c.Nome)
                .Skip((qp.page - 1) * qp.pageSize)
                .Take(qp.pageSize)
                .Select(c => new
                {
                    id = c.Id,
                    nome = c.Nome,
                    descricao = c.Descricao,
                    ordem = c.Ordem,
                    ativa = c.Ativa,
                    criadoEm = c.CriadoEm,
                    perguntasCount = c.Perguntas.Count()
                })
                .ToListAsync();

            return Results.Ok(new { total, page = qp.page, pageSize = qp.pageSize, items });
        });

        // GET /api/categories/{id}
        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var c = await db.Categorias.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            return c is null ? Results.NotFound() : Results.Ok(c);
        });

        // POST /api/categories
        group.MapPost("", async (CreateCategoryRequest dto, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nome)) return Results.BadRequest("Nome é obrigatório.");

            // evita duplicata (case-insensitive)
            var exists = await db.Categorias.AnyAsync(c => EF.Functions.ILike(c.Nome, dto.Nome));
            if (exists) return Results.Conflict("Já existe uma categoria com esse nome.");

            var cat = new Categoria
            {
                Id = Guid.NewGuid(),
                Nome = dto.Nome.Trim(),
                Descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? null : dto.Descricao.Trim(),
                Ordem = 0,
                Ativa = true,
                CriadoEm = DateTime.UtcNow
            };

            db.Categorias.Add(cat);
            await db.SaveChangesAsync();
            return Results.Created($"/api/categories/{cat.Id}", new { id = cat.Id });
        });

        // PUT /api/categories/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateCategoryRequest dto, AppDbContext db) =>
        {
            var cat = await db.Categorias.FirstOrDefaultAsync(c => c.Id == id);
            if (cat is null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(dto.Nome)) return Results.BadRequest("Nome é obrigatório.");

            var dup = await db.Categorias
                .AnyAsync(c => c.Id != id && EF.Functions.ILike(c.Nome, dto.Nome));
            if (dup) return Results.Conflict("Já existe uma categoria com esse nome.");

            cat.Nome = dto.Nome.Trim();
            cat.Descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? null : dto.Descricao.Trim();
            if (dto.Ordem.HasValue) cat.Ordem = dto.Ordem.Value;

            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // PATCH /api/categories/{id}/status
        group.MapPatch("/{id:guid}/status", async (Guid id, ToggleCategoryStatusRequest dto, AppDbContext db) =>
        {
            var cat = await db.Categorias.FirstOrDefaultAsync(c => c.Id == id);
            if (cat is null) return Results.NotFound();

            cat.Ativa = dto.Ativa;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var cat = await db.Categorias.FirstOrDefaultAsync(c => c.Id == id);
            if (cat is null) return Results.NotFound();

            // NOVO: bloqueia se houver perguntas vinculadas
            var hasPerguntas = await db.Perguntas.AnyAsync(p => p.CategoriaId == id);
            if (hasPerguntas)
                return Results.Conflict(new
                {
                    message = "Não é possível excluir: existem perguntas vinculadas a esta categoria. Inative-a ou remova/realoque as perguntas primeiro."
                });

            db.Categorias.Remove(cat);

            try
            {
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            // 23503 = foreign_key_violation (FK em feedbacks ou outras)
            catch (DbUpdateException ex) when (
                ex.InnerException is Exception ie &&
                ie.GetType().Name == "PostgresException" &&
                ie.GetType().GetProperty("SqlState")?.GetValue(ie)?.ToString() == "23503"
            )
            {
                return Results.Conflict(new
                {
                    message = "Não é possível excluir: a categoria possui vínculos (ex.: feedbacks). Inative-a ou remova/realoque os vínculos primeiro."
                });
            }
            catch
            {
                return Results.Problem("Erro ao excluir categoria.");
            }
        });
        
        return app;
    }

    public record QueryParams(
        string? search = null,
        bool? onlyActive = true,
        int page = 1,
        int pageSize = 20);
}
