using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TalkClass.Domain.Entities;

namespace TalkClass.Infrastructure.Persistence.Configurations;

public class PerguntaOpcaoConfiguration : IEntityTypeConfiguration<PerguntaOpcao>
{
    public void Configure(EntityTypeBuilder<PerguntaOpcao> b)
    {
        b.ToTable("pergunta_opcoes");
        b.HasKey(x => x.Id);

        b.Property(x => x.Texto).IsRequired().HasMaxLength(200);

        b.HasOne(x => x.Pergunta)
            .WithMany(p => p.Opcoes)
            .HasForeignKey(x => x.PerguntaId)
            .OnDelete(DeleteBehavior.Cascade); // excluir pergunta => exclui opções
    }
}
