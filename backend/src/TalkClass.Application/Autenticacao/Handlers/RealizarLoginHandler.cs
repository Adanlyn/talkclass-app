using Microsoft.EntityFrameworkCore;
using TalkClass.Application.Autenticacao.Commands;
using TalkClass.Application.Common.Interfaces;
using TalkClass.Application.Common.Responses;
using TalkClass.Domain.ValueObjects;

namespace TalkClass.Application.Autenticacao.Handlers;

public class RealizarLoginHandler
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public RealizarLoginHandler(IAppDbContext db, IPasswordHasher hasher, IJwtTokenService jwt)
    {
        _db = db; _hasher = hasher; _jwt = jwt;
    }

    public async Task<AuthResult?> Handle(RealizarLoginCommand command, CancellationToken ct = default)
    {
        var req = command.Request;
        var targetCpf = new Cpf(req.Cpf); // <- parâmetro já no tipo do modelo

        var admin = await _db.Administradores
            .AsNoTracking()
            .Where(a => a.IsActive && a.Cpf == targetCpf) // <- comparação model-type
            .SingleOrDefaultAsync(ct);

        if (admin is null) return null;
        if (!_hasher.Verify(req.Senha, admin.SenhaHash)) return null;

        var (token, exp) = _jwt.CreateToken(admin);
        var expiresIn = (int)Math.Max(1, (exp - DateTime.UtcNow).TotalSeconds);
        return new AuthResult(token, expiresIn);
    }
}
