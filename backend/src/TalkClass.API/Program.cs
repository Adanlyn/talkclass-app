using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TalkClass.API.Auth;
using TalkClass.API.Endpoints;
using TalkClass.Application.Autenticacao.Dtos;
using TalkClass.Application.Autenticacao.Handlers;
using TalkClass.Application.Common.Interfaces;
using TalkClass.Application.Validations;
using TalkClass.Infrastructure.Auth;
using TalkClass.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Se rodar em container, força bind em 0.0.0.0:5252
if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
{
    builder.WebHost.UseUrls("http://0.0.0.0:5252");
}

const string MyCors = "_mycors";
builder.Services.AddCors(o =>
{
    o.AddPolicy(MyCors, p => p
        .WithOrigins(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// 1) Config
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

// 2) DbContext (Postgres)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// 3) DI
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<IPasswordHasher, PasswordHasherBcrypt>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<RealizarLoginHandler>();

// 4) AuthN/AuthZ
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = jwtSettings.ToValidationParameters());
builder.Services.AddAuthorization(opt =>
{
    opt.AddPolicy(Policies.Admin, p => p.RequireRole("Admin"));
});

// 5) Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 6) FluentValidation
builder.Services.AddScoped<FluentValidation.IValidator<LoginRequestDto>, LoginRequestValidator>();

var app = builder.Build();

// 7) Migrate e SEED
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    if (!await db.Administradores.AnyAsync())
    {
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        db.Administradores.Add(new TalkClass.Domain.Entities.Administrador
        {
            Nome = "Admin Master",
            Email = "admin@talkclass.local",
            Cpf = new TalkClass.Domain.ValueObjects.Cpf("12345678909"),
            SenhaHash = hasher.Hash("SenhaForte!123"),
            Roles = "Admin"
        });
        await db.SaveChangesAsync();
    }
}

// 8) Middleware (Swagger sempre ativo)
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(MyCors);

app.UseAuthentication();
app.UseAuthorization();

// 9) Endpoints
app.MapAuthEndpoints();
app.MapUserEndpoints();

app.Run();
