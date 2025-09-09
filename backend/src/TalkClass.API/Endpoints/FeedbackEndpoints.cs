using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalkClass.Application.Feedbacks.Dtos;
using TalkClass.Domain.Entities;
using TalkClass.Domain.Enums;
using TalkClass.Infrastructure.Persistence;
using TalkClass.API.Auth;
using TalkClass.Application.Feedbacks.Validators;


namespace TalkClass.API.Endpoints;

public static class FeedbackEndpoints
{
    public static IEndpointRouteBuilder MapFeedbackEndpoints(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/api/feedbacks");

        // Envio anônimo de feedback
        grp.MapPost("/", CreateFeedback).AllowAnonymous();

        // Listagem recente (somente Admin)
        grp.MapGet("/recent", GetRecent).RequireAuthorization(Policies.Admin);

        return app;
    }

    private static async Task<IResult> CreateFeedback(
        [FromBody] CreateFeedbackDto req,
        HttpContext http,
        AppDbContext db)
    {
        var categoria = await db.Categorias
            .AsNoTracking()
            .Where(c => c.IsActive && c.Id == req.CategoriaId)
            .FirstOrDefaultAsync();

        if (categoria is null) return Results.BadRequest("Categoria inválida/inativa.");

        var perguntas = await db.Perguntas
            .AsNoTracking()
            .Where(p => p.CategoriaId == req.CategoriaId)
            .ToListAsync();

        if (!perguntas.Any()) return Results.BadRequest("Categoria sem perguntas.");

        var idsValidos = perguntas.Select(p => p.Id).ToHashSet();
        if (req.Respostas.Any(r => !idsValidos.Contains(r.PerguntaId)))
            return Results.BadRequest("Há respostas para perguntas fora da categoria.");

        var fb = new Feedback
        {
            CategoriaId = req.CategoriaId,
            CursoOuTurma = req.CursoOuTurma,
            OrigemIp = http.Connection.RemoteIpAddress?.ToString()
        };

        foreach (var r in req.Respostas)
        {
            fb.Respostas.Add(new FeedbackResposta
            {
                PerguntaId = r.PerguntaId,
                Tipo = r.Tipo,
                ValorNota  = r.Tipo == TipoAvaliacao.Nota       ? r.ValorNota  : null,
                ValorBool  = r.Tipo == TipoAvaliacao.SimNao     ? r.ValorBool  : null,
                ValorOpcao = r.Tipo == TipoAvaliacao.Frequencia ? r.ValorOpcao : null,
                ValorTexto = r.Tipo == TipoAvaliacao.Texto      ? r.ValorTexto : null,
            });
        }

        db.Feedbacks.Add(fb);
        await db.SaveChangesAsync();

        return Results.Created($"/api/feedbacks/{fb.Id}", new { fb.Id, fb.CreatedAt });
    }

    private static async Task<IResult> GetRecent(AppDbContext db, int take = 20)
    {
        var items = await db.Feedbacks
            .AsNoTracking()
            .OrderByDescending(f => f.CreatedAt)
            .Take(take)
            .Select(f => new {
                f.Id,
                f.CreatedAt,
                Categoria = f.Categoria.Nome,
                Respostas = f.Respostas.Count
            })
            .ToListAsync();

        return Results.Ok(items);
    }
}
