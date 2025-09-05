namespace TalkClass.Domain.Enums;

public enum TipoAvaliacao
{
    Nota = 1,       // 1..5 (ou outra escala)
    SimNao = 2,     // true/false
    Frequencia = 3, // "Sempre;Às vezes;Raramente;Nunca"
    Texto = 4       // resposta aberta
}
