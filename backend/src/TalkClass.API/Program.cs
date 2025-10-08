using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using TalkClass.API.Endpoints;
using TalkClass.Application.Common.Interfaces;
using TalkClass.Infrastructure.Persistence;
using TalkClass.Application.Autenticacao.Dtos;
using TalkClass.Application.Autenticacao.Handlers;
using TalkClass.Infrastructure.Auth;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

string? connStr =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DEFAULTCONNECTION"]
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"];

if (string.IsNullOrWhiteSpace(connStr))
    throw new InvalidOperationException("Connection string não encontrada.");

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connStr));
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p => p.WithOrigins("http://localhost:5174").AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "talkclass.dev";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "talkclass.dev";
var jwtKey      = builder.Configuration["Jwt:Key"]      ?? throw new InvalidOperationException("Jwt:Key ausente");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

// DI – validações e handlers usados nos endpoints de auth
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestDto>();
builder.Services.AddScoped<RealizarLoginHandler>();

builder.Services.AddSingleton<IPasswordHasher, PasswordHasherBcrypt>();

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();   // POST /api/auth/login
app.MapUserEndpoints();   // GET  /api/user/me (protegido)
app.MapFeedbackEndpoints();

app.MapCategoryEndpoints();

app.Run();
