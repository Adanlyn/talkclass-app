using Microsoft.EntityFrameworkCore;
using TalkClass.Application.Common.Interfaces;
using TalkClass.Domain.Entities;
using TalkClass.Domain.ValueObjects;

namespace TalkClass.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Administrador> Administradores => Set<Administrador>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Aplica todas as IEntityTypeConfiguration<> deste assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Conversão do ValueObject CPF <-> coluna string
        modelBuilder.Entity<Administrador>()
            .Property(a => a.Cpf)
            .HasConversion(
                v => v.Value,
                v => new Cpf(v)
            );

        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => base.SaveChangesAsync(cancellationToken);
}
