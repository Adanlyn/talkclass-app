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
    public DbSet<PerguntaOpcao> PerguntaOpcoes => Set<PerguntaOpcao>();   // << NOVO DbSet
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<FeedbackResposta> FeedbackRespostas => Set<FeedbackResposta>();
    public DbSet<Administrador> Administradores => Set<Administrador>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ValueObject CPF
        modelBuilder.Entity<Administrador>()
            .Property(a => a.Cpf)
            .HasConversion(v => v.Value, v => new Cpf(v));

        // Categoria
        modelBuilder.Entity<Categoria>(e =>
        {
            e.ToTable("categorias");
            e.HasKey(x => x.Id);

            e.Property(x => x.Nome).HasMaxLength(120).IsRequired();
            e.Property(x => x.Descricao).HasMaxLength(500);
            e.Property(x => x.Ordem).HasDefaultValue(0);
            e.Property(x => x.Ativa).HasDefaultValue(true);

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

            e.Property(x => x.Enunciado).HasMaxLength(500).IsRequired();
            e.Property(x => x.Tipo).HasConversion<int>().IsRequired();
            e.Property(x => x.Obrigatoria).HasDefaultValue(true);
            e.Property(x => x.Ordem).HasDefaultValue(0);
            e.Property(x => x.Ativa).HasDefaultValue(true);

            e.HasMany(x => x.Opcoes)
             .WithOne(o => o.Pergunta)
             .HasForeignKey(o => o.PerguntaId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // PerguntaOpcao
        modelBuilder.Entity<PerguntaOpcao>(e =>
        {
            e.ToTable("pergunta_opcoes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Texto).HasMaxLength(200).IsRequired();
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

            e.Property(x => x.Tipo).HasConversion<int>().IsRequired();

            e.HasOne(x => x.Pergunta)
             .WithMany(p => p.Respostas)
             .HasForeignKey(x => x.PerguntaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        base.OnModelCreating(modelBuilder);
    }
}
