using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using TalkClass.API.Dtos;
using TalkClass.Application.Autenticacao.Commands;
using TalkClass.Application.Autenticacao.Dtos;
using TalkClass.Application.Common.Responses;
using TalkClass.Application.Autenticacao.Handlers;

namespace TalkClass.API.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth");

        g.MapPost("/login",
            async Task<Results<Ok<LoginResponseDto>, UnauthorizedHttpResult, BadRequest<string>>>
            (LoginRequestDto dto, IValidator<LoginRequestDto> validator, RealizarLoginHandler handler, CancellationToken ct) =>
            {
                var val = await validator.ValidateAsync(dto, ct);
                if (!val.IsValid) return TypedResults.BadRequest(string.Join("; ", val.Errors.Select(e => e.ErrorMessage)));

                var result = await handler.Handle(new RealizarLoginCommand(dto), ct);
                if (result is null) return TypedResults.Unauthorized();

                return TypedResults.Ok(new LoginResponseDto(result.Token, result.ExpiresInSeconds));
            });

        return app;
    }
}
