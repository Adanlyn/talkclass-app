using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace TalkClass.API.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/user").RequireAuthorization();

        g.MapGet("/me", (ClaimsPrincipal user) =>
        {
            return Results.Ok(new
            {
                Id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                Nome = user.FindFirst(ClaimTypes.Name)?.Value,
                Cpf = user.FindFirst("cpf")?.Value,
                Role = user.FindFirst(ClaimTypes.Role)?.Value
            });
        });

        return app;
    }
}
