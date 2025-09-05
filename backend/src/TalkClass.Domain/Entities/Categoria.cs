namespace TalkClass.Domain.Entities;

public class Categoria
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = default!;
    public bool IsActive { get; set; } = true;

    public List<Pergunta> Perguntas { get; set; } = new();
}
