using Microsoft.EntityFrameworkCore;
using TalkClass.Application.Common.Interfaces;
using TalkClass.Domain.Entities;
using TalkClass.Domain.ValueObjects;

namespace TalkClass.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Pergunta> Perguntas => Set<Pergunta>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<FeedbackResposta> FeedbackRespostas => Set<FeedbackResposta>();

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

        // Categoria
        modelBuilder.Entity<Categoria>(e =>
        {
            e.ToTable("categorias");
            e.HasKey(x => x.Id);
            e.Property(x => x.Nome).HasMaxLength(120).IsRequired();

            e.HasMany(x => x.Perguntas)
             .WithOne(p => p.Categoria)
             .HasForeignKey(p => p.CategoriaId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Pergunta
        modelBuilder.Entity<Pergunta>(e =>
        {
            e.ToTable("perguntas");
            e.HasKey(x => x.Id);
            e.Property(x => x.Enunciado).HasMaxLength(300).IsRequired();
        });

        // Feedback
        modelBuilder.Entity<Feedback>(e =>
        {
            e.ToTable("feedbacks");
            e.HasKey(x => x.Id);

            e.HasOne(x => x.Categoria)
             .WithMany()
             .HasForeignKey(x => x.CategoriaId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(x => x.Respostas)
             .WithOne(r => r.Feedback)
             .HasForeignKey(r => r.FeedbackId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // FeedbackResposta
        modelBuilder.Entity<FeedbackResposta>(e =>
        {
            e.ToTable("feedback_respostas");
            e.HasKey(x => x.Id);

            e.HasOne(x => x.Pergunta)
             .WithMany()
             .HasForeignKey(x => x.PerguntaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => base.SaveChangesAsync(cancellationToken);
}
