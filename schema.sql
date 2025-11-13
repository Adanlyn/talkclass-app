--
-- PostgreSQL database dump
--

\restrict RUZj8QUCIuI3B6YEr6sCvEFiO5jeS9AEmNFO2fgkRitPwLwrfpbLBKp25kSv1Pp

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

ALTER TABLE IF EXISTS ONLY public.perguntas DROP CONSTRAINT IF EXISTS "perguntas_CategoriaId_fkey";
ALTER TABLE IF EXISTS ONLY public.pergunta_opcoes DROP CONSTRAINT IF EXISTS "pergunta_opcoes_PerguntaId_fkey";
ALTER TABLE IF EXISTS ONLY public.feedbacks DROP CONSTRAINT IF EXISTS "feedbacks_CategoriaId_fkey";
ALTER TABLE IF EXISTS ONLY public.feedback_respostas DROP CONSTRAINT IF EXISTS "feedback_respostas_PerguntaId_fkey";
ALTER TABLE IF EXISTS ONLY public.feedback_respostas DROP CONSTRAINT IF EXISTS "feedback_respostas_FeedbackId_fkey";
DROP INDEX IF EXISTS public.ux_categorias_nome_lower;
DROP INDEX IF EXISTS public.ux_administradores_email_lower;
DROP INDEX IF EXISTS public.ix_fr_valortexto_gin;
DROP INDEX IF EXISTS public.ix_fr_tipo_nota;
DROP INDEX IF EXISTS public.idx_fr_pergunta_tipo;
DROP INDEX IF EXISTS public.idx_feedbacks_criadoem;
DROP INDEX IF EXISTS public.idx_feedback_respostas_feedback;
DROP INDEX IF EXISTS public."IX_administradores_IsActive";
DROP INDEX IF EXISTS public."IX_administradores_Cpf";
ALTER TABLE IF EXISTS ONLY public.perguntas DROP CONSTRAINT IF EXISTS perguntas_pkey;
ALTER TABLE IF EXISTS ONLY public.pergunta_opcoes DROP CONSTRAINT IF EXISTS pergunta_opcoes_pkey;
ALTER TABLE IF EXISTS ONLY public.feedbacks DROP CONSTRAINT IF EXISTS feedbacks_pkey;
ALTER TABLE IF EXISTS ONLY public.feedback_respostas DROP CONSTRAINT IF EXISTS feedback_respostas_pkey;
ALTER TABLE IF EXISTS ONLY public.categorias DROP CONSTRAINT IF EXISTS categorias_pkey;
ALTER TABLE IF EXISTS ONLY public.administradores DROP CONSTRAINT IF EXISTS "PK_administradores";
DROP VIEW IF EXISTS public.v_topics_semana;
DROP TABLE IF EXISTS public.perguntas;
DROP TABLE IF EXISTS public.pergunta_opcoes;
DROP TABLE IF EXISTS public.feedbacks;
DROP TABLE IF EXISTS public.feedback_respostas;
DROP TABLE IF EXISTS public.categorias;
DROP TABLE IF EXISTS public.administradores;
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

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
    "Nome" text NOT NULL,
    "Descricao" text,
    "Ativa" boolean DEFAULT true NOT NULL,
    "Ordem" integer DEFAULT 0 NOT NULL
);


--
-- Name: feedback_respostas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_respostas (
    "Id" uuid NOT NULL,
    "FeedbackId" uuid NOT NULL,
    "PerguntaId" uuid NOT NULL,
    "Tipo" smallint NOT NULL,
    "ValorNota" numeric(4,2),
    "ValorBool" boolean,
    "ValorOpcao" integer,
    "ValorTexto" text,
    CONSTRAINT chk_valornota_1_5 CHECK ((("Tipo" <> 0) OR (("ValorNota" >= (1)::numeric) AND ("ValorNota" <= (5)::numeric))))
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    "Id" uuid NOT NULL,
    "CategoriaId" uuid NOT NULL,
    "CriadoEm" timestamp with time zone DEFAULT now() NOT NULL,
    "CursoOuTurma" text,
    "NomeIdentificado" text,
    "ContatoIdentificado" text
);


--
-- Name: pergunta_opcoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pergunta_opcoes (
    "Id" uuid NOT NULL,
    "PerguntaId" uuid NOT NULL,
    "Texto" text NOT NULL,
    "Valor" integer NOT NULL
);


--
-- Name: perguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perguntas (
    "Id" uuid NOT NULL,
    "CategoriaId" uuid NOT NULL,
    "Enunciado" text NOT NULL,
    "Tipo" smallint NOT NULL,
    "Ativa" boolean DEFAULT true NOT NULL,
    "Obrigatoria" boolean DEFAULT false NOT NULL,
    "Ordem" integer DEFAULT 0 NOT NULL
);


--
-- Name: v_topics_semana; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_topics_semana AS
 SELECT (date_trunc('week'::text, f."CriadoEm"))::date AS week,
    lower(m.m[1]) AS topic,
    count(*) AS total
   FROM ((public.feedback_respostas r
     JOIN public.feedbacks f ON ((f."Id" = r."FeedbackId")))
     CROSS JOIN LATERAL regexp_matches(COALESCE(r."ValorTexto", ''::text), '#([[:alnum:]_]+)'::text, 'g'::text) m(m))
  WHERE (r."Tipo" = 3)
  GROUP BY ((date_trunc('week'::text, f."CriadoEm"))::date), (lower(m.m[1]))
  ORDER BY ((date_trunc('week'::text, f."CriadoEm"))::date), (lower(m.m[1]));


--
-- Name: administradores PK_administradores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT "PK_administradores" PRIMARY KEY ("Id");


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY ("Id");


--
-- Name: feedback_respostas feedback_respostas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_respostas
    ADD CONSTRAINT feedback_respostas_pkey PRIMARY KEY ("Id");


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY ("Id");


--
-- Name: pergunta_opcoes pergunta_opcoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pergunta_opcoes
    ADD CONSTRAINT pergunta_opcoes_pkey PRIMARY KEY ("Id");


--
-- Name: perguntas perguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perguntas
    ADD CONSTRAINT perguntas_pkey PRIMARY KEY ("Id");


--
-- Name: IX_administradores_Cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IX_administradores_Cpf" ON public.administradores USING btree ("Cpf");


--
-- Name: IX_administradores_IsActive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IX_administradores_IsActive" ON public.administradores USING btree ("IsActive");


--
-- Name: idx_feedback_respostas_feedback; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedback_respostas_feedback ON public.feedback_respostas USING btree ("FeedbackId");


--
-- Name: idx_feedbacks_criadoem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacks_criadoem ON public.feedbacks USING btree ("CriadoEm");


--
-- Name: idx_fr_pergunta_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fr_pergunta_tipo ON public.feedback_respostas USING btree ("PerguntaId", "Tipo");


--
-- Name: ix_fr_tipo_nota; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fr_tipo_nota ON public.feedback_respostas USING btree ("ValorNota") WHERE ("Tipo" = 0);


--
-- Name: ix_fr_valortexto_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_fr_valortexto_gin ON public.feedback_respostas USING gin ("ValorTexto" public.gin_trgm_ops);


--
-- Name: ux_administradores_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_administradores_email_lower ON public.administradores USING btree (lower(("Email")::text)) WHERE ("Email" IS NOT NULL);


--
-- Name: ux_categorias_nome_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_categorias_nome_lower ON public.categorias USING btree (lower("Nome"));


--
-- Name: feedback_respostas feedback_respostas_FeedbackId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_respostas
    ADD CONSTRAINT "feedback_respostas_FeedbackId_fkey" FOREIGN KEY ("FeedbackId") REFERENCES public.feedbacks("Id") ON DELETE CASCADE;


--
-- Name: feedback_respostas feedback_respostas_PerguntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_respostas
    ADD CONSTRAINT "feedback_respostas_PerguntaId_fkey" FOREIGN KEY ("PerguntaId") REFERENCES public.perguntas("Id") ON DELETE RESTRICT;


--
-- Name: feedbacks feedbacks_CategoriaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT "feedbacks_CategoriaId_fkey" FOREIGN KEY ("CategoriaId") REFERENCES public.categorias("Id") ON DELETE RESTRICT;


--
-- Name: pergunta_opcoes pergunta_opcoes_PerguntaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pergunta_opcoes
    ADD CONSTRAINT "pergunta_opcoes_PerguntaId_fkey" FOREIGN KEY ("PerguntaId") REFERENCES public.perguntas("Id") ON DELETE CASCADE;


--
-- Name: perguntas perguntas_CategoriaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perguntas
    ADD CONSTRAINT "perguntas_CategoriaId_fkey" FOREIGN KEY ("CategoriaId") REFERENCES public.categorias("Id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict RUZj8QUCIuI3B6YEr6sCvEFiO5jeS9AEmNFO2fgkRitPwLwrfpbLBKp25kSv1Pp

