--
-- PostgreSQL database dump
--

\restrict CbTJMjg5D3vygkRA9nGf7cO1WbKo7PUH2dmhN1dTQ9hA3MxezWEs2QdenOTEXUm

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.perguntas DROP CONSTRAINT IF EXISTS "FK_perguntas_categorias_CategoriaId";
ALTER TABLE IF EXISTS ONLY public.pergunta_opcoes DROP CONSTRAINT IF EXISTS "FK_pergunta_opcoes_perguntas_PerguntaId";
ALTER TABLE IF EXISTS ONLY public.feedbacks DROP CONSTRAINT IF EXISTS "FK_feedbacks_categorias_CategoriaId";
ALTER TABLE IF EXISTS ONLY public.feedback_respostas DROP CONSTRAINT IF EXISTS "FK_feedback_respostas_perguntas_PerguntaId";
ALTER TABLE IF EXISTS ONLY public.feedback_respostas DROP CONSTRAINT IF EXISTS "FK_feedback_respostas_feedbacks_FeedbackId";
DROP INDEX IF EXISTS public.ux_perguntas_categoria_ordem;
DROP INDEX IF EXISTS public.ux_pergunta_opcoes_pergunta_valor;
DROP INDEX IF EXISTS public.ux_pergunta_opcoes_pergunta_texto;
DROP INDEX IF EXISTS public.ux_categorias_nome_lower;
DROP INDEX IF EXISTS public.ux_administradores_email_lower;
DROP INDEX IF EXISTS public.ix_feedbacks_criadoem;
DROP INDEX IF EXISTS public.ix_feedbacks_categoria_criadoem;
DROP INDEX IF EXISTS public.ix_feedback_respostas_tipo;
DROP INDEX IF EXISTS public.ix_feedback_respostas_feedback_pergunta;
DROP INDEX IF EXISTS public."IX_perguntas_CategoriaId";
DROP INDEX IF EXISTS public."IX_pergunta_opcoes_PerguntaId";
DROP INDEX IF EXISTS public."IX_feedbacks_CategoriaId";
DROP INDEX IF EXISTS public."IX_feedback_respostas_PerguntaId";
DROP INDEX IF EXISTS public."IX_feedback_respostas_FeedbackId";
DROP INDEX IF EXISTS public."IX_administradores_IsActive";
DROP INDEX IF EXISTS public."IX_administradores_Cpf";
ALTER TABLE IF EXISTS ONLY public.perguntas DROP CONSTRAINT IF EXISTS "PK_perguntas";
ALTER TABLE IF EXISTS ONLY public.pergunta_opcoes DROP CONSTRAINT IF EXISTS "PK_pergunta_opcoes";
ALTER TABLE IF EXISTS ONLY public.feedbacks DROP CONSTRAINT IF EXISTS "PK_feedbacks";
ALTER TABLE IF EXISTS ONLY public.feedback_respostas DROP CONSTRAINT IF EXISTS "PK_feedback_respostas";
ALTER TABLE IF EXISTS ONLY public.categorias DROP CONSTRAINT IF EXISTS "PK_categorias";
ALTER TABLE IF EXISTS ONLY public.administradores DROP CONSTRAINT IF EXISTS "PK_administradores";
ALTER TABLE IF EXISTS ONLY public."__EFMigrationsHistory" DROP CONSTRAINT IF EXISTS "PK___EFMigrationsHistory";
DROP VIEW IF EXISTS public.v_feedbacks;
DROP TABLE IF EXISTS public.perguntas;
DROP TABLE IF EXISTS public.pergunta_opcoes;
DROP TABLE IF EXISTS public.feedbacks;
DROP TABLE IF EXISTS public.feedback_respostas;
DROP TABLE IF EXISTS public.categorias;
DROP TABLE IF EXISTS public.administradores;
DROP TABLE IF EXISTS public."__EFMigrationsHistory";
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


--
-- Name: administradores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administradores (
    "Id" uuid NOT NULL,
    "Nome" character varying(120) NOT NULL,
    "Email" character varying(160),
    "Cpf" character varying(11) NOT NULL,
    "SenhaHash" character varying(200) NOT NULL,
    "IsActive" boolean NOT NULL,
    "Roles" character varying(100) NOT NULL,
    "CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_adm_cpf_digits CHECK ((("Cpf")::text ~ '^[0-9]{11}$'::text))
);


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    "Id" uuid NOT NULL,
    "Nome" character varying(120) NOT NULL,
    "Ativa" boolean DEFAULT true NOT NULL,
    "CriadoEm" timestamp with time zone DEFAULT now() NOT NULL,
    "Descricao" character varying(500),
    "Ordem" integer DEFAULT 0 NOT NULL
);


--
-- Name: feedback_respostas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_respostas (
    "Id" uuid NOT NULL,
    "FeedbackId" uuid NOT NULL,
    "PerguntaId" uuid NOT NULL,
    "Tipo" integer NOT NULL,
    "ValorNota" integer,
    "ValorBool" boolean,
    "ValorOpcao" text,
    "ValorTexto" text,
    CONSTRAINT ck_fr_tipo_valor CHECK (((("Tipo" = 0) AND ("ValorNota" IS NOT NULL) AND ("ValorBool" IS NULL) AND ("ValorOpcao" IS NULL) AND ("ValorTexto" IS NULL)) OR (("Tipo" = 1) AND ("ValorBool" IS NOT NULL) AND ("ValorNota" IS NULL) AND ("ValorOpcao" IS NULL) AND ("ValorTexto" IS NULL)) OR (("Tipo" = 2) AND ("ValorOpcao" IS NOT NULL) AND ("ValorNota" IS NULL) AND ("ValorBool" IS NULL) AND ("ValorTexto" IS NULL)) OR (("Tipo" = 3) AND ("ValorTexto" IS NOT NULL) AND ("ValorNota" IS NULL) AND ("ValorBool" IS NULL) AND ("ValorOpcao" IS NULL))))
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    "Id" uuid NOT NULL,
    "CategoriaId" uuid NOT NULL,
    "CriadoEm" timestamp with time zone DEFAULT now() NOT NULL,
    "CursoOuTurma" text,
    "NomeIdentificado" character varying(120),
    "ContatoIdentificado" character varying(160)
);


--
-- Name: pergunta_opcoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pergunta_opcoes (
    "Id" uuid NOT NULL,
    "PerguntaId" uuid NOT NULL,
    "Texto" character varying(200) NOT NULL,
    "Valor" integer NOT NULL
);


--
-- Name: perguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perguntas (
    "Id" uuid NOT NULL,
    "CategoriaId" uuid NOT NULL,
    "Enunciado" character varying(500) NOT NULL,
    "Tipo" integer NOT NULL,
    "Ativa" boolean DEFAULT true NOT NULL,
    "Obrigatoria" boolean DEFAULT true NOT NULL,
    "Ordem" integer DEFAULT 0 NOT NULL
);


--
-- Name: v_feedbacks; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_feedbacks AS
 SELECT "Id" AS id,
    "CategoriaId" AS categoria_id,
    "CursoOuTurma" AS curso_ou_turma,
    "CriadoEm" AS criado_em
   FROM public.feedbacks;


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: administradores PK_administradores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT "PK_administradores" PRIMARY KEY ("Id");


--
-- Name: categorias PK_categorias; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT "PK_categorias" PRIMARY KEY ("Id");


--
-- Name: feedback_respostas PK_feedback_respostas; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_respostas
    ADD CONSTRAINT "PK_feedback_respostas" PRIMARY KEY ("Id");


--
-- Name: feedbacks PK_feedbacks; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "PK_feedbacks" PRIMARY KEY ("Id");


--
-- Name: pergunta_opcoes PK_pergunta_opcoes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pergunta_opcoes
    ADD CONSTRAINT "PK_pergunta_opcoes" PRIMARY KEY ("Id");


--
-- Name: perguntas PK_perguntas; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perguntas
    ADD CONSTRAINT "PK_perguntas" PRIMARY KEY ("Id");


--
-- Name: IX_administradores_Cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_administradores_Cpf" ON public.administradores USING btree ("Cpf");


--
-- Name: IX_administradores_IsActive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_administradores_IsActive" ON public.administradores USING btree ("IsActive");


--
-- Name: IX_feedback_respostas_FeedbackId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_feedback_respostas_FeedbackId" ON public.feedback_respostas USING btree ("FeedbackId");


--
-- Name: IX_feedback_respostas_PerguntaId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_feedback_respostas_PerguntaId" ON public.feedback_respostas USING btree ("PerguntaId");


--
-- Name: IX_feedbacks_CategoriaId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_feedbacks_CategoriaId" ON public.feedbacks USING btree ("CategoriaId");


--
-- Name: IX_pergunta_opcoes_PerguntaId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_pergunta_opcoes_PerguntaId" ON public.pergunta_opcoes USING btree ("PerguntaId");


--
-- Name: IX_perguntas_CategoriaId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_perguntas_CategoriaId" ON public.perguntas USING btree ("CategoriaId");


--
-- Name: ix_feedback_respostas_feedback_pergunta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feedback_respostas_feedback_pergunta ON public.feedback_respostas USING btree ("FeedbackId", "PerguntaId");


--
-- Name: ix_feedback_respostas_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feedback_respostas_tipo ON public.feedback_respostas USING btree ("Tipo");


--
-- Name: ix_feedbacks_categoria_criadoem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feedbacks_categoria_criadoem ON public.feedbacks USING btree ("CategoriaId", "CriadoEm");


--
-- Name: ix_feedbacks_criadoem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feedbacks_criadoem ON public.feedbacks USING btree ("CriadoEm");


--
-- Name: ux_administradores_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_administradores_email_lower ON public.administradores USING btree (lower(("Email")::text)) WHERE ("Email" IS NOT NULL);


--
-- Name: ux_categorias_nome_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_categorias_nome_lower ON public.categorias USING btree (lower(("Nome")::text));


--
-- Name: ux_pergunta_opcoes_pergunta_texto; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_pergunta_opcoes_pergunta_texto ON public.pergunta_opcoes USING btree ("PerguntaId", lower(("Texto")::text));


--
-- Name: ux_pergunta_opcoes_pergunta_valor; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_pergunta_opcoes_pergunta_valor ON public.pergunta_opcoes USING btree ("PerguntaId", "Valor");


--
-- Name: ux_perguntas_categoria_ordem; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_perguntas_categoria_ordem ON public.perguntas USING btree ("CategoriaId", "Ordem");


--
-- Name: feedback_respostas FK_feedback_respostas_feedbacks_FeedbackId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_respostas
    ADD CONSTRAINT "FK_feedback_respostas_feedbacks_FeedbackId" FOREIGN KEY ("FeedbackId") REFERENCES public.feedbacks("Id") ON DELETE CASCADE;


--
-- Name: feedback_respostas FK_feedback_respostas_perguntas_PerguntaId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_respostas
    ADD CONSTRAINT "FK_feedback_respostas_perguntas_PerguntaId" FOREIGN KEY ("PerguntaId") REFERENCES public.perguntas("Id") ON DELETE RESTRICT;


--
-- Name: feedbacks FK_feedbacks_categorias_CategoriaId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "FK_feedbacks_categorias_CategoriaId" FOREIGN KEY ("CategoriaId") REFERENCES public.categorias("Id") ON DELETE RESTRICT;


--
-- Name: pergunta_opcoes FK_pergunta_opcoes_perguntas_PerguntaId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pergunta_opcoes
    ADD CONSTRAINT "FK_pergunta_opcoes_perguntas_PerguntaId" FOREIGN KEY ("PerguntaId") REFERENCES public.perguntas("Id") ON DELETE CASCADE;


--
-- Name: perguntas FK_perguntas_categorias_CategoriaId; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perguntas
    ADD CONSTRAINT "FK_perguntas_categorias_CategoriaId" FOREIGN KEY ("CategoriaId") REFERENCES public.categorias("Id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict CbTJMjg5D3vygkRA9nGf7cO1WbKo7PUH2dmhN1dTQ9hA3MxezWEs2QdenOTEXUm

