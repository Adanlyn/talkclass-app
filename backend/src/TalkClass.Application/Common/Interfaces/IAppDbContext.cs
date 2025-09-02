using Microsoft.EntityFrameworkCore;
using TalkClass.Domain.Entities;

namespace TalkClass.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Administrador> Administradores { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
