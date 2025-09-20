using System;
using System.Collections.Generic;

namespace TalkClass.Domain.Entities;

public class Feedback
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Relação com Categoria
    public Guid CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }

    // Campo opcional que você usa no formulário
    public string? CursoOuTurma { get; set; }

    // >>> ADICIONADO: marcação de criação (era o que o endpoint usava)
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    // Respostas
    public ICollection<FeedbackResposta> Respostas { get; set; } = new List<FeedbackResposta>();
}
