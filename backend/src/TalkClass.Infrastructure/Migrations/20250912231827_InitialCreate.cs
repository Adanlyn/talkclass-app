using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TalkClass.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxValor",
                table: "perguntas");

            migrationBuilder.DropColumn(
                name: "MinValor",
                table: "perguntas");

            migrationBuilder.DropColumn(
                name: "Opcoes",
                table: "perguntas");

            migrationBuilder.DropColumn(
                name: "OrigemIp",
                table: "feedbacks");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "categorias");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "feedbacks",
                newName: "CriadoEm");

            migrationBuilder.AlterColumn<string>(
                name: "Enunciado",
                table: "perguntas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300);

            migrationBuilder.AddColumn<bool>(
                name: "Ativa",
                table: "perguntas",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "Obrigatoria",
                table: "perguntas",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "Ordem",
                table: "perguntas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Ativa",
                table: "categorias",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CriadoEm",
                table: "categorias",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Descricao",
                table: "categorias",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Ordem",
                table: "categorias",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "pergunta_opcoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PerguntaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Texto = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Valor = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pergunta_opcoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pergunta_opcoes_perguntas_PerguntaId",
                        column: x => x.PerguntaId,
                        principalTable: "perguntas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pergunta_opcoes_PerguntaId",
                table: "pergunta_opcoes",
                column: "PerguntaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pergunta_opcoes");

            migrationBuilder.DropColumn(
                name: "Ativa",
                table: "perguntas");

            migrationBuilder.DropColumn(
                name: "Obrigatoria",
                table: "perguntas");

            migrationBuilder.DropColumn(
                name: "Ordem",
                table: "perguntas");

            migrationBuilder.DropColumn(
                name: "Ativa",
                table: "categorias");

            migrationBuilder.DropColumn(
                name: "CriadoEm",
                table: "categorias");

            migrationBuilder.DropColumn(
                name: "Descricao",
                table: "categorias");

            migrationBuilder.DropColumn(
                name: "Ordem",
                table: "categorias");

            migrationBuilder.RenameColumn(
                name: "CriadoEm",
                table: "feedbacks",
                newName: "CreatedAt");

            migrationBuilder.AlterColumn<string>(
                name: "Enunciado",
                table: "perguntas",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<int>(
                name: "MaxValor",
                table: "perguntas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinValor",
                table: "perguntas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Opcoes",
                table: "perguntas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrigemIp",
                table: "feedbacks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "categorias",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
