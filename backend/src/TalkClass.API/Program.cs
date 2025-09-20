using Microsoft.EntityFrameworkCore;
using TalkClass.API.Endpoints;
using TalkClass.Application.Common.Interfaces;
using TalkClass.Infrastructure.Persistence;

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

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();

app.MapFeedbackEndpoints();

app.Run();
