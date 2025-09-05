namespace TalkClass.Domain.Entities;

public class Feedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CategoriaId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Metadados opcionais
    public string? OrigemIp { get; set; }
    public string? CursoOuTurma { get; set; }

    public Categoria Categoria { get; set; } = default!;
    public List<FeedbackResposta> Respostas { get; set; } = new();
}
