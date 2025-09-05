using TalkClass.Domain.Enums;

namespace TalkClass.Domain.Entities;

public class Pergunta
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CategoriaId { get; set; }
    public string Enunciado { get; set; } = default!;
    public TipoAvaliacao Tipo { get; set; }

    // Escala numérica (opcional)
    public int? MinValor { get; set; }
    public int? MaxValor { get; set; }

    // Opções para frequência/múltipla escolha (se usar)
    public string? Opcoes { get; set; } // "Sempre;Às vezes;Raramente;Nunca"

    public Categoria Categoria { get; set; } = default!;
}
