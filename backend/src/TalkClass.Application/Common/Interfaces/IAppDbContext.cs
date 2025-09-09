using Microsoft.EntityFrameworkCore;
using TalkClass.Domain.Entities;

namespace TalkClass.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Administrador> Administradores { get; }

    DbSet<Categoria> Categorias { get; }
    DbSet<Pergunta> Perguntas { get; }
    DbSet<Feedback> Feedbacks { get; }
    DbSet<FeedbackResposta> FeedbackRespostas { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
