using FluentValidation;
using TalkClass.Application.Autenticacao.Dtos;

namespace TalkClass.Application.Validations;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Cpf).NotEmpty().WithMessage("CPF é obrigatório")
            .Must(v => v!.Count(char.IsDigit) == 11).WithMessage("CPF deve ter 11 dígitos");
        RuleFor(x => x.Senha).NotEmpty().MinimumLength(6);
    }
}
