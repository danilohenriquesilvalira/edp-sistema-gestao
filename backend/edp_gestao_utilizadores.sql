--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: configuracoes_sistema; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.configuracoes_sistema (
    id integer NOT NULL,
    chave character varying(100) NOT NULL,
    valor text NOT NULL,
    descricao character varying(255),
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.configuracoes_sistema OWNER TO danilo;

--
-- Name: configuracoes_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.configuracoes_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracoes_sistema_id_seq OWNER TO danilo;

--
-- Name: configuracoes_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.configuracoes_sistema_id_seq OWNED BY public.configuracoes_sistema.id;


--
-- Name: logs_auditoria; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.logs_auditoria (
    id integer NOT NULL,
    utilizador_id integer,
    nome_utilizador character varying(255),
    acao character varying(255) NOT NULL,
    modulo character varying(100) NOT NULL,
    ip character varying(50),
    detalhes jsonb,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.logs_auditoria OWNER TO danilo;

--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.logs_auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_auditoria_id_seq OWNER TO danilo;

--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.logs_auditoria_id_seq OWNED BY public.logs_auditoria.id;


--
-- Name: perfil_permissoes; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.perfil_permissoes (
    perfil character varying(50) NOT NULL,
    permissao_id integer NOT NULL
);


ALTER TABLE public.perfil_permissoes OWNER TO danilo;

--
-- Name: permissoes; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.permissoes (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    descricao character varying(255),
    modulo character varying(100) NOT NULL,
    acao character varying(100) NOT NULL
);


ALTER TABLE public.permissoes OWNER TO danilo;

--
-- Name: permissoes_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.permissoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissoes_id_seq OWNER TO danilo;

--
-- Name: permissoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.permissoes_id_seq OWNED BY public.permissoes.id;


--
-- Name: plcs; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.plcs (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    ip_address character varying(15) NOT NULL,
    rack integer DEFAULT 0 NOT NULL,
    slot integer DEFAULT 0 NOT NULL,
    gateway character varying(15),
    ativo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.plcs OWNER TO danilo;

--
-- Name: plcs_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.plcs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plcs_id_seq OWNER TO danilo;

--
-- Name: plcs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.plcs_id_seq OWNED BY public.plcs.id;


--
-- Name: preferencias_utilizadores; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.preferencias_utilizadores (
    utilizador_id integer NOT NULL,
    tema_escuro boolean DEFAULT false NOT NULL,
    idioma character varying(10) DEFAULT 'pt'::character varying NOT NULL,
    notificacoes boolean DEFAULT true NOT NULL,
    dashboard jsonb DEFAULT '{}'::jsonb,
    atualizado_em timestamp with time zone
);


ALTER TABLE public.preferencias_utilizadores OWNER TO danilo;

--
-- Name: sessoes; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.sessoes (
    id integer NOT NULL,
    utilizador_id integer NOT NULL,
    token character varying(255) NOT NULL,
    ip character varying(50) NOT NULL,
    dispositivo character varying(255),
    user_agent character varying(255),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_em timestamp without time zone NOT NULL
);


ALTER TABLE public.sessoes OWNER TO danilo;

--
-- Name: sessoes_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.sessoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessoes_id_seq OWNER TO danilo;

--
-- Name: sessoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.sessoes_id_seq OWNED BY public.sessoes.id;


--
-- Name: status_utilizadores; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.status_utilizadores (
    utilizador_id integer NOT NULL,
    online boolean DEFAULT false NOT NULL,
    ultima_atividade timestamp with time zone,
    ip character varying(50),
    dispositivo character varying(255)
);


ALTER TABLE public.status_utilizadores OWNER TO danilo;

--
-- Name: tags; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    plc_id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    db_number bigint NOT NULL,
    byte_offset bigint NOT NULL,
    bit_offset bigint,
    tipo character varying(20) NOT NULL,
    tamanho bigint DEFAULT 1,
    subsistema character varying(50),
    descricao text,
    ativo boolean DEFAULT true NOT NULL,
    update_interval_ms integer DEFAULT 1000 NOT NULL,
    only_on_change boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tags OWNER TO danilo;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO danilo;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: tokens_recuperacao; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.tokens_recuperacao (
    id integer NOT NULL,
    utilizador_id integer NOT NULL,
    token character varying(255) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expira_em timestamp without time zone NOT NULL,
    usado boolean DEFAULT false
);


ALTER TABLE public.tokens_recuperacao OWNER TO danilo;

--
-- Name: tokens_recuperacao_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.tokens_recuperacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_recuperacao_id_seq OWNER TO danilo;

--
-- Name: tokens_recuperacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.tokens_recuperacao_id_seq OWNED BY public.tokens_recuperacao.id;


--
-- Name: utilizadores; Type: TABLE; Schema: public; Owner: danilo
--

CREATE TABLE public.utilizadores (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    perfil character varying(50) NOT NULL,
    estado character varying(20) DEFAULT 'ativo'::character varying NOT NULL,
    tentativas_login integer DEFAULT 0,
    ultimo_login timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    foto_perfil character varying(255),
    dois_fatores_ativo boolean DEFAULT false,
    segredo_dois_fatores character varying(255)
);


ALTER TABLE public.utilizadores OWNER TO danilo;

--
-- Name: utilizadores_id_seq; Type: SEQUENCE; Schema: public; Owner: danilo
--

CREATE SEQUENCE public.utilizadores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utilizadores_id_seq OWNER TO danilo;

--
-- Name: utilizadores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: danilo
--

ALTER SEQUENCE public.utilizadores_id_seq OWNED BY public.utilizadores.id;


--
-- Name: configuracoes_sistema id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.configuracoes_sistema ALTER COLUMN id SET DEFAULT nextval('public.configuracoes_sistema_id_seq'::regclass);


--
-- Name: logs_auditoria id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.logs_auditoria ALTER COLUMN id SET DEFAULT nextval('public.logs_auditoria_id_seq'::regclass);


--
-- Name: permissoes id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.permissoes ALTER COLUMN id SET DEFAULT nextval('public.permissoes_id_seq'::regclass);


--
-- Name: plcs id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.plcs ALTER COLUMN id SET DEFAULT nextval('public.plcs_id_seq'::regclass);


--
-- Name: sessoes id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.sessoes ALTER COLUMN id SET DEFAULT nextval('public.sessoes_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: tokens_recuperacao id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tokens_recuperacao ALTER COLUMN id SET DEFAULT nextval('public.tokens_recuperacao_id_seq'::regclass);


--
-- Name: utilizadores id; Type: DEFAULT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.utilizadores ALTER COLUMN id SET DEFAULT nextval('public.utilizadores_id_seq'::regclass);


--
-- Data for Name: configuracoes_sistema; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.configuracoes_sistema (id, chave, valor, descricao, atualizado_em) FROM stdin;
1	senha_tamanho_minimo	8	Tamanho m¡nimo para senhas	2025-04-07 10:42:50.652861
2	senha_complexidade	media	N¡vel de complexidade para senhas (baixa, media, alta)	2025-04-07 10:42:50.652861
3	senha_validade_dias	90	Dias de validade da senha antes de exigir altera‡Æo	2025-04-07 10:42:50.652861
4	sessao_expiracao_minutos	60	Tempo de expira‡Æo da sessÆo em minutos	2025-04-07 10:42:50.652861
5	dois_fatores_obrigatorio	false	Se a autentica‡Æo de dois fatores ‚ obrigat¢ria para todos	2025-04-07 10:42:50.652861
6	tema_padrao	claro	Tema padrÆo do sistema (claro ou escuro)	2025-04-07 10:42:50.652861
7	idioma_padrao	pt-PT	Idioma padrÆo do sistema	2025-04-07 10:42:50.652861
8	app_name	EDP Gestão de Utilizadores	Nome da aplicação	2025-04-08 11:52:22.870656
9	max_login_attempts	5	Número máximo de tentativas de login	2025-04-08 11:52:22.871746
10	session_timeout	30	Tempo de inatividade para encerramento da sessão (minutos)	2025-04-08 11:52:22.87276
11	user_activity_timeout	15	Tempo em minutos para considerar um utilizador inativo	2025-04-08 15:30:15.9483
\.


--
-- Data for Name: logs_auditoria; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.logs_auditoria (id, utilizador_id, nome_utilizador, acao, modulo, ip, detalhes, criado_em) FROM stdin;
1	\N	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 11:54:10.166316
2	\N	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 11:54:19.925948
3	\N	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 12:02:01.653787
4	\N	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 13:18:45.909087
5	\N	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 13:55:33.180991
6	\N	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 13:56:39.691475
7	\N	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 6, "nome": "Teste Utilizador", "email": "teste@exemplo.com", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-08 13:59:25.088786
8	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 16:27:35.331246
9	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Thunder Client (https://www.thunderclient.com)"}	2025-04-08 16:45:58.21375
10	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 09:23:18.332309
11	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "reU9LAsolpgRNAaEAyLBoBDD6tMO2wbmheaVq2rrHnE="}	2025-04-09 09:26:04.728946
12	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 09:26:38.867267
13	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 09:40:54.45454
14	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "rjh-jZ2nONw78jqPgLTH_gCkyUQCT8LO9GOz3zXsZ-k="}	2025-04-09 09:44:29.267828
15	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 09:47:45.25692
16	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "Q5mitSpJ_GId5_tc6n91oO4ZlN-PuwvESvjnP23pTEw="}	2025-04-09 09:49:56.855116
17	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 09:50:07.983243
18	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 10:11:30.946612
19	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 6, "nome": "Teste Utilizador", "email": "teste@exemplo.com", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-09 10:11:58.157491
20	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 10, "nome": "danilo henrique ", "email": "danilo@rls.pt", "estado": "Ativo", "perfil": "Administrador"}	2025-04-09 10:12:26.725133
21	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "F3ND8hRtV_6g0pXpsFsjTqszztIa20EMIoLMbliOb-U="}	2025-04-09 10:12:31.490053
22	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 10:12:42.191802
23	10	danilo henrique 	Atualizar	Utilizadores	127.0.0.1	{"id": 6, "nome": "Teste Utilizador", "email": "teste@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-09 10:17:20.31808
24	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "TPCk4fpzuKW1cv9L7qqJoJbBU0_arcBiTuATcMIUALg="}	2025-04-09 10:17:26.093921
28	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 10:18:17.201156
29	9	Administrador	Encerrar Todas Sessões	Sessões	127.0.0.1	{"utilizador_id": 9}	2025-04-09 10:18:26.996401
30	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "q8r9l9fAYPWRJTpg5cOEZZrAdjBKeJuSZVTXxNMNq8g="}	2025-04-09 10:18:29.007595
31	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 10:18:30.335117
32	9	Administrador	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador", "foto_perfil": "/uploads/avatars/user_9_1744190329.png"}	2025-04-09 10:18:49.216941
33	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "kXSm5cfC0rvFD526Cvvqqh1HCl9pxvFF-lTjQkdWDiI="}	2025-04-09 10:19:38.327607
34	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 10:37:57.50353
35	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "glNa11kXAoEzWRrucPUs1dW5aHig3fDX0DfisXCWrqs="}	2025-04-09 10:38:00.66792
157	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "yNxPiobIMN7b3roT9ZVVXsgrrz_8gB1HEutSsUX315g="}	2025-04-09 21:39:21.106522
158	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 21:39:25.620753
159	9	Administrador	Remover Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador"}	2025-04-09 21:39:32.860707
160	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": true, "notificacoes": true}	2025-04-09 21:39:43.584892
161	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "E1fAno-Nr2DmfH06f6JP93lk9ifFP6Idjz6PAaR5TT0="}	2025-04-09 22:12:50.104946
162	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 22:13:07.422456
26	\N	Teste Utilizador	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": true, "notificacoes": true}	2025-04-09 10:18:01.314888
197	9	Administrador	Encerrar Sessão	Sessões	127.0.0.1	{"sessao_id": 88, "utilizador_id": 10}	2025-04-10 12:00:42.761802
198	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "Jwbr9hlz8_Soc3wM-Y-taQFkM69WCDUo2mfZpwCaT5w="}	2025-04-10 12:01:10.925717
199	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 12:01:13.620546
36	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:07:35.318564
37	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "XMltjrXAOM_Gakc-rnjxOoIdPIjXKmL7H9gcY5dE0oc="}	2025-04-09 11:08:06.350005
38	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:08:07.579925
39	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "jPx5TKCrQXJdgbUoHdlh6qRingDIUBkuLxXfzKPBCfw="}	2025-04-09 11:08:25.264021
40	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:08:37.079782
41	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "Oo5ImDq3yebLFEUzkRtuHvq322hpwokIvS2opmbxp40="}	2025-04-09 11:08:52.126686
42	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:15:21.662771
43	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "u6URmlUtx-fouJi-IQQA2D64xm3Kjq1K016etZx8tmU="}	2025-04-09 11:15:37.211778
44	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:22:48.357716
45	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "RrtoKe9u93wLN2X7zOOxdrFqj4_xwXukauU3VgpM8oI="}	2025-04-09 11:22:55.840235
46	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:23:07.907159
47	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "KaAnEFasgjKhkERMGn9TrtycwYa6TTrpLmzU4ngc_4w="}	2025-04-09 11:23:08.693365
48	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:23:16.558131
49	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "8S1PA6NnjPadSf5XcurjMPy8ILzXzexeyJIpcg9Dr-c="}	2025-04-09 11:23:17.40256
50	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:24:37.785863
51	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "n5PU588mMb3G8Lbpe6EDmw0V-_wRSxZO1wm2TY9Csf4="}	2025-04-09 11:26:00.136999
52	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:26:35.967555
53	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "O2gpC4lLF2OlDt8xBZsRw41p1gMG2DF9EsW0Pee5tf4="}	2025-04-09 11:26:38.318625
54	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:27:52.909931
55	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "TL-f2LBPhVvpIlkP8Q7Jg3VviqvvVUlToN-qJY6g78U="}	2025-04-09 11:27:54.149462
56	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:28:33.614179
57	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "KARRYnO9ISBealGnBtfnKBu5cI6y84msGUF9anLojpw="}	2025-04-09 11:28:34.963898
58	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:29:21.560319
59	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "1FaMIXM1fm0gg0m0o8mhVcrLxFB-0_6vFiMkFfguvB0="}	2025-04-09 11:29:23.059621
60	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:29:48.62315
61	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "mjw7mjoClJv-iR6aaENUOBeEtdRB9H8-68dlz5BOKlE="}	2025-04-09 11:29:50.314882
62	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:29:51.847397
63	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "Tye-Hv4fPUW_Cs3MEOAvhow2O_0gtN1ytTyfVUtQ6NM="}	2025-04-09 11:29:52.944175
64	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:29:54.402183
65	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "pZE9LSQWUM9YlmUPR8npF1tMXuq5BjbSHAm-a5qu9u4="}	2025-04-09 11:29:55.381711
66	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:30:03.783764
67	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "wGOlXo6QNvlP9kfCrwmvq7BENbnZnFdAwAkjff2efhg="}	2025-04-09 11:30:05.267786
68	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:30:06.573762
69	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "L-pyuZ4fm7lUkyUTKX8rZ1Y646QBqQF63qzFimDAJmo="}	2025-04-09 11:30:37.751468
70	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:30:39.410236
71	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "VLvUnYawJuqVU34Wma3W-2nueivARNXwoQnRccRizRY="}	2025-04-09 11:30:40.651685
72	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:30:42.347421
73	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "OjRJt8qboo-ZOp2rDy2MobkDAfB_Wx91zMTvUPN2I-0="}	2025-04-09 11:30:43.644595
74	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:32:11.671929
75	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "vSM3Ft1ixRo5d8GETxRA-AzhNoPj6hVFoje8-xZfJXk="}	2025-04-09 11:32:21.160963
76	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:32:22.909123
77	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "9W7Jnaj6t9wWTWibkJNsnoCpU2f3YclaHd5eDR_u_8Y="}	2025-04-09 11:33:44.530041
78	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:33:46.033708
79	10	danilo henrique 	Atualizar	Utilizadores	127.0.0.1	{"id": 6, "nome": "Teste Utilizador", "email": "teste@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-09 11:34:00.578274
80	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "6-t53Ll3WSVC9z1aHRFiNWEnuCprHE02ZPGc4nuzbvI="}	2025-04-09 11:34:46.97832
81	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:35:24.059195
82	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "JvfISgciewoxs-oW2Mf8_YFg87bLn6msjILP4F1puA8="}	2025-04-09 11:35:41.237333
83	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:35:42.558954
84	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "5Vj_X99b--RHsIGZMeY15KZkNcZ1M5nTj0y0ZZNkx9M="}	2025-04-09 11:39:07.702739
85	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:39:09.273984
86	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "JcvRMD8SUimrKLeuQEyOvDfVsNF2TS-gNZ94ZhiQoGA="}	2025-04-09 11:39:26.189918
87	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:43:23.635613
88	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "oM81VkAgR6DcYPUHcmrDWAzSn0SCBEGVzczGmrWhBBg="}	2025-04-09 11:43:24.898082
89	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:48:21.483284
90	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "J7miSaoIBalQVPKbBlk2fsZg0xbUpwm32IV0vIPs--g="}	2025-04-09 11:48:22.609128
91	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:53:22.295832
92	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "M3BLP1IEAwF6H8mtE5ggGjxr0NgUI0NfDU6dFl58MuY="}	2025-04-09 11:53:24.679251
93	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:53:26.154495
94	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "an-HYtezj5BIQsid3d7Ir7-neDMRESPr4BeClVEG0pM="}	2025-04-09 11:53:28.374387
95	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:53:30.204829
96	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "E6IiBfftUMmR5cdeC1eV6IfOZiN2LEfnB9ZR5R5kBtw="}	2025-04-09 11:53:31.646166
97	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:53:33.106679
98	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "jVfZI_FIkA5nAyYJ06cna8bm54joxYpAZjcDxoL5kBw="}	2025-04-09 11:53:34.739737
99	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:53:36.104919
100	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "KTsH8el47dE4lzhOeWlflBCL61WyYTXFaGNReTytJiQ="}	2025-04-09 11:53:37.606085
101	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:53:39.058713
102	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 11:54:33.533815
103	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 13:57:11.507126
104	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "SqfTbnXDUOeW-OSOvJt_LoA0kfAfIkvBfXcOg_Jqppo="}	2025-04-09 14:02:05.243929
105	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 14:02:07.678919
106	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "QwJ16E98yFRUnIFL6KkmWWE4VA2ofYdNjj1yuog9KVE="}	2025-04-09 14:02:22.370911
107	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 14:02:38.916166
108	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "o0niGypRSQTZi9jCBjmjd-zLrrLHSnges4--eM5Vn8Q="}	2025-04-09 14:06:26.655087
109	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 14:06:28.844227
110	10	danilo henrique 	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 10, "nome": "danilo henrique ", "foto_perfil": "/uploads/avatars/user_10_1744204033.png"}	2025-04-09 14:07:13.768024
111	10	danilo henrique 	Atualizar	Preferências	127.0.0.1	{"idioma": "en", "tema_escuro": false, "notificacoes": true}	2025-04-09 14:09:50.980879
112	10	danilo henrique 	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": true, "notificacoes": true}	2025-04-09 14:09:55.234485
113	10	danilo henrique 	Atualizar	Preferências	127.0.0.1	{"idioma": "en", "tema_escuro": true, "notificacoes": true}	2025-04-09 14:09:57.541737
114	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 14:48:01.480249
115	10	danilo henrique 	Remover Foto	Utilizadores	127.0.0.1	{"id": 10, "nome": "danilo henrique "}	2025-04-09 14:48:32.738228
116	10	danilo henrique 	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 10, "nome": "danilo henrique ", "foto_perfil": "/uploads/avatars/user_10_1744206570.png"}	2025-04-09 14:49:30.231662
117	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "bVosN4GnFYJ7apXr9-GxEbUPIidIrWzJKNQbAcRWhNk="}	2025-04-09 15:01:14.325518
121	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:02:07.672484
122	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "-MEymjSTfON8f6opFokT1PRtDdHHTcZHUt9MFW0XTkQ="}	2025-04-09 15:02:13.906909
125	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:02:32.271516
126	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "-KyBCyTWYUj6po33MZNxkLwsNPDO1TVc6VKbUyQ75KU="}	2025-04-09 15:11:01.218935
127	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:11:02.699876
128	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "01XaNOolRSvBAVBgB_MizNgtqt1AN15tJdUfDOywb90="}	2025-04-09 15:14:17.327557
129	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:22:05.204368
130	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "bfMKoSwPZK3YKmWUNpxHTcYkDnruuUfiJxImaS9l4Tg="}	2025-04-09 15:29:56.18701
131	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:29:57.641631
132	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "kUp6Xexm_vOqWZ1PYXiEvnbKNbM4oV4uUKEwH5ptrxc="}	2025-04-09 15:38:47.616288
133	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:38:49.111094
134	9	Administrador	Encerrar Todas Sessões	Sessões	127.0.0.1	{"utilizador_id": 10}	2025-04-09 16:02:39.296854
135	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "UGW3PMxi8w1FnYx-BdCTsmbvzLTExUmxliub_KhsMVA="}	2025-04-09 16:06:14.214943
136	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 16:13:40.245998
137	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "ksb11dZr4Yzfkb8g77Nu_fzyEz3s_uJotuBUbjTiWIc="}	2025-04-09 16:48:28.381773
138	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 17:17:37.463574
139	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "fYaEG4GsDklP_WTbMobJqnNJy3VFBPdRPucVkkI3Vqw="}	2025-04-09 17:17:39.219231
140	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 17:20:38.953731
141	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "OkYpDCWOHHd5kEO3ehgSD_1uzASkkApDXQUdH4pimPc="}	2025-04-09 17:20:40.329504
142	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 17:25:20.678467
143	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "CW1KJzPGB1G7zqQ_5gNGvyxS3aNYZJcUFtPR3dtaOHM="}	2025-04-09 17:25:21.66917
144	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 17:27:00.386394
145	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "FLICtN_QIVLGQ37ZFZ5n2ybzAP0SQ0I3uCpGNyx271w="}	2025-04-09 17:30:24.618289
146	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 17:43:06.690793
147	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "84eYqTvgNt0oVBmB0atyI7xKSDaKIJsxu43JWXmjkbA="}	2025-04-09 17:43:12.685734
148	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 17:55:48.533186
149	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "FRnEZnCWOddGNVxPRQ-SmCIXq5vSh1cdf9J8bll4NWg="}	2025-04-09 20:51:20.203622
150	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 20:51:22.999392
151	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "JOUO4pVsOy-eWe5r9RLusLdEwYNTorbc9E51oKIuMDM="}	2025-04-09 21:07:12.594345
152	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 21:07:23.504883
153	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "en", "tema_escuro": false, "notificacoes": true}	2025-04-09 21:27:25.124903
154	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "en", "tema_escuro": true, "notificacoes": true}	2025-04-09 21:27:27.695627
155	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "en", "tema_escuro": false, "notificacoes": true}	2025-04-09 21:27:29.141712
156	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "en", "tema_escuro": true, "notificacoes": true}	2025-04-09 21:27:42.956346
163	9	Administrador	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador", "foto_perfil": "/uploads/avatars/user_9_1744233688.png"}	2025-04-09 22:21:28.63285
164	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": true, "notificacoes": true}	2025-04-09 22:45:37.703076
165	9	Administrador	Remover Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador"}	2025-04-09 22:50:03.528213
166	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "y7Xb-6niEkddcDJpO-ZSytsB9sQq0ju8bK6N922Px04="}	2025-04-09 23:21:50.010131
167	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 23:22:06.960102
168	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "DW698CHAc-7oUYyP54l3SZUzxDDdtwGA0G37E_h9KD8="}	2025-04-09 23:34:13.452504
169	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 09:18:34.566389
170	9	Administrador	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador", "foto_perfil": "/uploads/avatars/user_9_1744274246.png"}	2025-04-10 09:37:26.254697
171	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "bGQ6B_CQHVsM1JDGU56lZ51maLPnQMbsVmZtoagiz8s="}	2025-04-10 09:48:36.216913
172	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 09:50:09.610816
173	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "TjK-vk8sBpfg6WRjL-Q9kT3zMjrvk9RCR1aqQmdBTn0="}	2025-04-10 09:50:43.590348
174	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 09:54:30.71404
175	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "IhRSZ0DpCtQlRM6rLhQpc38nloWwSvKE6CaNpj2kC1s="}	2025-04-10 09:58:05.339154
176	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:02:57.884168
177	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "urgHhIa2R1LSs7KmR1sFj1F5Nxsp1pBleSaJVT3L1iQ="}	2025-04-10 10:03:27.714863
178	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:07:28.985869
179	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "RD1WfpWxm1Np0VT11ULcSVc-0syl_LGXz8dvarca420="}	2025-04-10 10:08:06.276775
180	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:08:09.048177
181	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "ER5qi4Evl3s4pa-07JhIPB-37UXvdlN3YsVPIIFJPQM="}	2025-04-10 10:09:20.001187
182	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:09:22.851051
183	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "OxBRpaiS42FU811u-7QmsNhNEHVVwSTbY5PjaHb1OIg="}	2025-04-10 10:19:09.740705
184	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:19:42.485506
185	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "2ssK8o46VeBnP30uUzceb4NtCzOrLn6dJBww00Cnmhw="}	2025-04-10 10:27:02.421088
186	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:27:06.172076
187	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "A2j7MwjC06M2vY1-EEkQK5OYCrKnFNSlZD7BGLe9jHo="}	2025-04-10 10:33:24.861886
188	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 10:33:35.156735
25	\N	Teste Utilizador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 10:17:34.982526
27	\N	Teste Utilizador	Logout	Autenticação	127.0.0.1	{"session_id": "JZfJt0Zg4jmhbdID7i8TKWlfxOVfMDEz2t1sP5k2Fag="}	2025-04-09 10:18:11.235035
118	\N	Teste Utilizador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:01:23.183038
119	\N	Teste Utilizador	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": false, "notificacoes": true}	2025-04-09 15:01:48.718271
120	\N	Teste Utilizador	Logout	Autenticação	127.0.0.1	{"session_id": "qYelsLrVjBIdaO7jw1FZjNsaAggOOxVsgmbCNOmP3pA="}	2025-04-09 15:01:53.297477
123	\N	Teste Utilizador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-09 15:02:21.425241
124	\N	Teste Utilizador	Logout	Autenticação	127.0.0.1	{"session_id": "N-Nc7Za_K2OJOpiJPqgKKYRqGIlplZE-NDt40yPPuew="}	2025-04-09 15:02:30.082728
189	9	Administrador	Excluir	Utilizadores	127.0.0.1	{"id": 6, "nome": "Teste Utilizador", "email": "teste@rls.pt"}	2025-04-10 11:04:34.853936
190	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 11, "nome": "danilo henrique ", "email": "teste@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-10 11:17:48.344497
191	9	Administrador	Excluir	Utilizadores	127.0.0.1	{"id": 11, "nome": "danilo henrique ", "email": "teste@rls.pt"}	2025-04-10 11:38:25.655669
192	9	Administrador	Remover Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador"}	2025-04-10 11:42:24.140676
193	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "CR5v_XpWs4ACv-tilLkPAAyooYpxFvx7GSmqp3Uxi-M="}	2025-04-10 11:44:33.353411
194	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 11:45:25.669841
195	9	Administrador	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador", "foto_perfil": "/uploads/avatars/user_9_1744281945.jpg"}	2025-04-10 11:45:45.682293
196	10	danilo henrique 	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 12:00:02.742402
200	9	Administrador	Encerrar Todas Sessões	Sessões	127.0.0.1	{"utilizador_id": 10}	2025-04-10 12:01:22.611539
201	10	danilo henrique 	Logout	Autenticação	127.0.0.1	{"session_id": "S1Vx0pWinU1ZeKBBJNc1VmBP57LxFzuhIREsWpa_mjA="}	2025-04-10 12:01:43.236319
202	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 12, "nome": "henrique", "email": "henrique@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-10 15:12:35.792721
203	12	henrique	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 15:13:45.255506
204	12	henrique	Logout	Autenticação	127.0.0.1	{"session_id": "Vm9HMVGfTkJ3ZAGwXAlJ79-b5iGqgelD59_14Rz0xFE="}	2025-04-10 15:14:06.142627
205	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 15:14:08.649467
206	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 13, "nome": "jone", "email": "jone@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-10 15:35:31.08522
207	9	Administrador	Excluir	Utilizadores	127.0.0.1	{"id": 13, "nome": "jone", "email": "jone@rls.pt"}	2025-04-10 15:36:22.261729
208	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 15:45:47.107357
209	9	Administrador	Encerrar Todas Sessões	Sessões	127.0.0.1	{"utilizador_id": 9}	2025-04-10 15:46:47.582294
210	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 16:58:03.237814
211	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "M_80haQEUfwkmizUXz8kIC8xjYScviR9HX-0KOtqXIA="}	2025-04-10 17:10:20.023979
212	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 17:10:22.038118
213	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "vZeIB55k9QYJ8nmzmi7svP3w_te662pmgrMSJFTxtIw="}	2025-04-10 20:22:00.058984
214	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 20:22:02.133102
215	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "LD3pGRPC45wuzccxcwfyymqubeKCq9-2tcwt07dAM3Q="}	2025-04-10 21:50:53.920353
216	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 21:50:58.282259
217	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "BB2qY3UjmPX9Vrg0QM0Nm9RddXdWgXDVeRxrJS_Gf6A="}	2025-04-10 22:05:53.536117
218	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 22:06:03.019606
219	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "ZrFhj8sPt_FslfOli-T7JCXSAyeRW55IfBTEFs2KrRI="}	2025-04-10 22:14:02.642791
220	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 22:14:04.435089
221	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 14, "nome": "danilo henrique silva", "email": "dan@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-10 23:21:11.280771
222	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "pLw6TYu9nZGwVMCAwlE5q-x4wnmWjVwQ5zvLpKaC5ZQ="}	2025-04-10 23:21:16.191334
223	14	danilo henrique silva	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 23:21:23.475948
224	14	danilo henrique silva	Logout	Autenticação	127.0.0.1	{"session_id": "9i8VeNgbr1phTemKBSUQX2bb0k03fVS557bw5Z8DNK8="}	2025-04-10 23:21:32.079928
225	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-10 23:21:34.337697
226	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 15, "nome": "matteo henrique", "email": "matteo@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-10 23:34:08.409719
227	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 15, "nome": "matteo henrique", "email": "matteo@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-10 23:34:35.129968
228	9	Administrador	Excluir	Utilizadores	127.0.0.1	{"id": 15, "nome": "matteo henrique", "email": "matteo@rls.pt"}	2025-04-10 23:34:41.601351
229	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "ZU5406mH8ZbVGa5zJJ_v1FarAd4KOKg088Whnmh2YAU="}	2025-04-11 09:07:14.437825
230	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 09:07:15.912713
231	9	Administrador	Criar	Utilizadores	127.0.0.1	{"id": 16, "nome": "Suport", "email": "suporte@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-11 09:38:42.487813
232	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 16, "nome": "Suport", "email": "suporte@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-11 09:38:58.045752
233	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "9ohrLnOy_j3BFkwoD7LsqZnixkvXlaBEJ5wgdhLZZgY="}	2025-04-11 09:39:00.523669
234	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 09:39:12.815173
235	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 16, "nome": "Suport", "email": "suporte@rls.pt", "estado": "Ativo", "perfil": "Utilizador"}	2025-04-11 09:39:22.118601
236	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "Q-1UY3to6ex3uMyOEciv-GzT4of2YD_9owcHa-3VV7k="}	2025-04-11 09:39:23.08876
237	16	Suport	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 09:39:27.964165
238	16	Suport	Logout	Autenticação	127.0.0.1	{"session_id": "2zRLOnrQ1dVbR42dxpt6FaE0BstBalp_3D32sdBmSSo="}	2025-04-11 09:39:42.487871
239	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 09:39:43.614921
240	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": true, "notificacoes": true}	2025-04-11 10:02:09.590244
241	9	Administrador	Atualizar	Preferências	127.0.0.1	{"idioma": "pt", "tema_escuro": false, "notificacoes": true}	2025-04-11 10:02:14.172105
242	9	Administrador	Remover Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador"}	2025-04-11 10:04:31.367623
243	9	Administrador	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador", "foto_perfil": "/uploads/avatars/user_9_1744362294.jpg"}	2025-04-11 10:04:54.240722
244	9	Administrador	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 9, "nome": "Administrador", "foto_perfil": "/uploads/avatars/user_9_1744363063.jpg"}	2025-04-11 10:17:43.078069
245	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 1, "nome": "Administrador", "email": "admin@edp.pt", "estado": "Ativo", "perfil": "Administrador"}	2025-04-11 10:50:49.064097
246	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 4, "nome": "Administrador", "email": "admin@dev.com", "estado": "Ativo", "perfil": "Administrador"}	2025-04-11 10:50:53.49272
247	9	Administrador	Atualizar	Utilizadores	127.0.0.1	{"id": 1, "nome": "Administrador", "email": "admin@edp.pt", "estado": "Inativo", "perfil": "Administrador"}	2025-04-11 10:52:52.246836
248	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 11:45:41.320526
249	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "ZCn6d5d01MYh-ombmS7pvwDZf6AnHbuaj_-isjUlwwQ="}	2025-04-11 22:07:04.119592
250	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:07:11.477481
251	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "ji7g-EASe-43skBy0yjnOqOUydf6NwbYiEVpS8aW3M0="}	2025-04-11 22:07:26.668598
252	16	Suport	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:07:30.211087
253	16	Suport	Logout	Autenticação	127.0.0.1	{"session_id": "9LCTaGLKAWCnAoycahna9l14nwiwxnvmhc3Z-MK-5p0="}	2025-04-11 22:12:07.94531
254	16	Suport	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:12:11.652819
255	16	Suport	Logout	Autenticação	127.0.0.1	{"session_id": "KQIxTZXhhSR1i5XozGyAeOys9fmGFhGfSU-FXN_MiYI="}	2025-04-11 22:18:30.022914
256	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:18:32.739868
257	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "y2C6ZkbkEtnZOeHZ68lLQhKwbYJSwJcP5Yq-eKxuofE="}	2025-04-11 22:18:39.402087
258	16	Suport	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:18:43.873297
259	16	Suport	Atualizar Foto	Utilizadores	127.0.0.1	{"id": 16, "nome": "Suport", "foto_perfil": "/uploads/avatars/user_16_1744406331.jpg"}	2025-04-11 22:18:51.999658
260	16	Suport	Logout	Autenticação	127.0.0.1	{"session_id": "19yeVQUPXr985-gpXlMizb-sFuscLGAEY8h9UKbsLTM="}	2025-04-11 22:18:56.470337
261	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:18:57.86144
262	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "rKfBaJwHZvP5Y1mqkVKffcnjIAPnz9rvZyOtSCL7wTA="}	2025-04-11 22:19:27.031108
263	16	Suport	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:19:33.522388
264	16	Suport	Remover Foto	Utilizadores	127.0.0.1	{"id": 16, "nome": "Suport"}	2025-04-11 22:19:38.634571
265	16	Suport	Logout	Autenticação	127.0.0.1	{"session_id": "6vT9lWaCmu6LY62CsOWIyEl7239NsfLr9UwmcwNIhew="}	2025-04-11 22:19:42.786805
266	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-11 22:19:45.226919
267	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-14 09:59:02.419871
268	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "9TS836lgHFszZKrV-OfxnWdnL04-8u-wiqvHrOdsipM="}	2025-04-14 09:59:08.126742
269	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-14 10:06:43.453936
270	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "q0aUrrwNf85rVoKcllZc4HcP0RE0N9QGWFQAsw6F0D4="}	2025-04-14 16:39:30.181879
271	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-15 09:46:08.050323
272	9	Administrador	Logout	Autenticação	127.0.0.1	{"session_id": "vSA1XEWLugjH9bMIFUEoXFx3nAW526R0E0IZ4B6Ncc0="}	2025-04-15 10:09:27.569175
273	9	Administrador	Login	Autenticação	127.0.0.1	{"user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0"}	2025-04-15 10:09:38.732464
\.


--
-- Data for Name: perfil_permissoes; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.perfil_permissoes (perfil, permissao_id) FROM stdin;
Gestor	1
Gestor	2
Gestor	3
Gestor	4
Gestor	6
Gestor	9
Gestor	10
Supervisor	1
Supervisor	2
Supervisor	4
Supervisor	7
Supervisor	9
Operador	1
Operador	7
Operador	9
Leitor	1
Leitor	2
Leitor	7
Leitor	9
Administrador	1
Administrador	2
Administrador	3
Administrador	4
Administrador	5
Administrador	6
Administrador	7
Administrador	8
Administrador	9
Administrador	10
Administrador	11
Administrador	12
Administrador	13
Administrador	14
Administrador	15
Administrador	16
Administrador	17
\.


--
-- Data for Name: permissoes; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.permissoes (id, nome, descricao, modulo, acao) FROM stdin;
1	Ver Dashboard	Visualizar o painel principal	dashboard	view
2	Listar Utilizadores	Ver lista de todos os utilizadores	utilizadores	list
3	Criar Utilizadores	Criar novos utilizadores	utilizadores	create
4	Editar Utilizadores	Editar dados de utilizadores	utilizadores	edit
5	Excluir Utilizadores	Excluir utilizadores do sistema	utilizadores	delete
6	Redefinir Senha	Redefinir senha de utilizadores	utilizadores	reset_password
7	Ver Logs	Visualizar logs de auditoria	auditoria	view
8	Configurar Sistema	Alterar configura‡äes do sistema	configuracoes	edit
9	Ver Sessäes	Visualizar sessäes ativas	sessoes	view
10	Encerrar Sessäes	Encerrar sessäes de utilizadores	sessoes	terminate
11	Gerir Utilizadores	Gerenciar utilizadores do sistema	Utilizadores	Gerenciar
12	Ver Logs Auditoria	Visualizar logs de auditoria	Auditoria	Visualizar
13	Gerir Configurações	Gerenciar configurações do sistema	Configurações	Gerenciar
14	Gerir Permissões	Gerenciar permissões e perfis	Permissões	Gerenciar
15	Ver Utilizadores Ativos	Visualizar utilizadores ativos no sistema	Status	Visualizar
16	Gerir Sessões	Gerenciar sessões de utilizadores	Sessões	Gerenciar
17	Ver Preferências	Visualizar preferências de utilizadores	Preferências	Visualizar
\.


--
-- Data for Name: plcs; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.plcs (id, nome, ip_address, rack, slot, gateway, ativo) FROM stdin;
1	PLC-Teste	192.168.1.33	0	1	\N	t
\.


--
-- Data for Name: preferencias_utilizadores; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.preferencias_utilizadores (utilizador_id, tema_escuro, idioma, notificacoes, dashboard, atualizado_em) FROM stdin;
10	t	en	t	{}	2025-04-09 13:09:57.540508+00
12	f	pt	t	{}	2025-04-10 14:13:50.952647+00
16	f	pt	t	{}	2025-04-11 08:39:34.711975+00
9	f	pt	t	{}	2025-04-11 09:02:14.170847+00
\.


--
-- Data for Name: sessoes; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.sessoes (id, utilizador_id, token, ip, dispositivo, user_agent, criado_em, expira_em) FROM stdin;
90	12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4OTkyMjUsImlhdCI6MTc0NDI5NDQyNSwic2Vzc2lvbl9pZCI6IlZtOUhNVkdmVGtKM1pBR3dYQWxKNzktYjVpR3FnZWxENTlfMTRSejB4RkU9Iiwic3ViIjoxMiwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.Yi22dXIk-tAxva9ZoB2YqLvUHhC8cvAcvqIja-2ggI4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 15:13:45.258115	2025-04-10 15:14:06.141385
91	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4OTkyNDgsImlhdCI6MTc0NDI5NDQ0OCwic2Vzc2lvbl9pZCI6IllmTW1RMUVMUUJJOE1xVFlxNExtemZaNUpMY0tITmRFcWY0Q3pEOFR0bWs9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.V1fwGP67C8cRmjdFi-nHL9tmpD_fSUsrJ6cO-VGkxmY	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 15:14:08.650696	2025-04-10 15:46:47.570417
5	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3MzA4NTUsImlhdCI6MTc0NDEyNjA1NSwic2Vzc2lvbl9pZCI6IjRYS2drR1BjUUYyVXlJUUNCU0FHazdERzBZcmtZak9VR3dhR2lQMEpEaUU9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.nqzrFDCQGCNJZWxDrAJfgCGtsXyaJmkALrkc0aw8Kss	127.0.0.1	Navegador Web	Thunder Client (https://www.thunderclient.com)	2025-04-08 16:27:35.334871	2025-04-10 15:46:47.570417
13	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTQ3NjIsImlhdCI6MTc0NDE4OTk2Miwic2Vzc2lvbl9pZCI6IlRQQ2s0ZnB6dUtXMWN2OUw3cXFKb0piQlUwX2FyY0JpVHVBVGNNSVVBTGc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.wYc6Kprxb4dnaFesYXMMry0GnZxwniTSEb35lrUK3J8	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 10:12:42.193103	2025-04-10 12:01:22.597745
6	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3MzE5NTgsImlhdCI6MTc0NDEyNzE1OCwic2Vzc2lvbl9pZCI6IkhpVlhSbzVNUUgzQW02QXBuQlpxeXlxaTVoT0dUa3dEUmszWnU1WWlfU1E9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.hw6yVd-g64I65qwrFTY62J0Q4IRcIrywFD65ItXP51s	127.0.0.1	Navegador Web	Thunder Client (https://www.thunderclient.com)	2025-04-08 16:45:58.216854	2025-04-10 15:46:47.570417
7	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTE3OTgsImlhdCI6MTc0NDE4Njk5OCwic2Vzc2lvbl9pZCI6InJlVTlMQXNvbHBnUk5BYUVBeUxCb0JERDZ0TU8yd2JtaGVhVnEycnJIbkU9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.UFh2jYcXiB9EdDsXNSuB-R5aOaFkPyIgzHmIqxhqMGA	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 09:23:18.335686	2025-04-10 15:46:47.570417
8	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTE5OTgsImlhdCI6MTc0NDE4NzE5OCwic2Vzc2lvbl9pZCI6IktLM1JFcGRGMXBLU2FrbGpqM2pUUWc5eTJXdEdnZjhMNGNmS3U3eEtKYW89Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.4srK4Hxwfyenw8hNpRyN66ov8ZOKPiE2Ek8x0y0CI6Q	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 09:26:38.869445	2025-04-10 15:46:47.570417
99	14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5Mjg0ODMsImlhdCI6MTc0NDMyMzY4Mywic2Vzc2lvbl9pZCI6IjlpOFZlTmdicjFwaFRlbUtCU1VRWDJiYjBrMDNmVlM1NTdidzVaOEROSzg9Iiwic3ViIjoxNCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.j6LoTe5teBkDuRTUgzk51R5kc_ehiTP0Bx-8DgyZemo	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 23:21:23.478074	2025-04-10 23:21:32.07675
100	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5Mjg0OTQsImlhdCI6MTc0NDMyMzY5NCwic2Vzc2lvbl9pZCI6IlpVNTQwNm1IOFpiVkdhNXpKSl92MUZhckFkNEtPS2cwODhXaG5taDJZQVU9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.mOZkexaUVZfFkNlLcpPdU1t7eXNbTyv0kEkfY9DHwU8	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 23:21:34.339621	2025-04-11 09:07:14.435828
115	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUyMjY0MDMsImlhdCI6MTc0NDYyMTYwMywic2Vzc2lvbl9pZCI6InEwYVVycndOZjg1clZvS2NsbFpjNEhjUDBSRTBOOVFHV0ZRQXN3NkYwRDQ9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.nj1S-7735H7qy4SQstB-c28Sa_5ZvcORxj6wnV6TxTg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-14 10:06:43.455135	2025-04-14 16:39:30.180113
9	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTI4NTQsImlhdCI6MTc0NDE4ODA1NCwic2Vzc2lvbl9pZCI6InJqaC1qWjJuT053NzhqcVBnTFRIX2dDa3lVUUNUOExPOUdPejN6WHNaLWs9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.f9ofu_Zg9RQvAcfqZRCKzQ0W3rq6fXJorT9Hm0O_F7w	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 09:40:54.457473	2025-04-10 15:46:47.570417
10	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTMyNjUsImlhdCI6MTc0NDE4ODQ2NSwic2Vzc2lvbl9pZCI6IlE1bWl0U3BKX0dJZDVfdGM2bjkxb080WmxOLVB1d3ZFU3ZqblAyM3BURXc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.eJd8kAfu_KurWWvrBFctD0MFNkYJno2rgZotzVX5C6s	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 09:47:45.257896	2025-04-10 15:46:47.570417
11	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTM0MDcsImlhdCI6MTc0NDE4ODYwNywic2Vzc2lvbl9pZCI6IlpYeHk1bWhhVWZJRlhIOFgwX0VETThrR1c0LXFvdE9qNlFBajdCeG5MYVE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.dbcSKg5unda1P9K1hznHeGkSrTOBTWxE_caJWl0F50E	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 09:50:07.984789	2025-04-10 15:46:47.570417
12	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTQ2OTAsImlhdCI6MTc0NDE4OTg5MCwic2Vzc2lvbl9pZCI6IkYzTkQ4aFJ0Vl82ZzBwWHBzRnNqVHFzenp0SWEyMEVNSW9MTWJsaU9iLVU9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.4oyABWjNoWt7ajzTl514SbCfbSCuUZp5_WNmCQjaUhg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 10:11:30.949263	2025-04-10 15:46:47.570417
21	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTg1MjEsImlhdCI6MTc0NDE5MzcyMSwic2Vzc2lvbl9pZCI6InU2VVJtbFV0eC1mb3VKaS1JUVFBMkQ2NHhtM0tqcTFLMDE2ZXRaeDh0bVU9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.ypsqK-XjxGWV3UQnTkD6GQ6qs8AJjP6byaq1Kb6Eix8	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:15:21.664028	2025-04-10 12:01:22.597745
92	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MDExNDcsImlhdCI6MTc0NDI5NjM0Nywic2Vzc2lvbl9pZCI6Inhlc2RLRmkzb1ZwR0ZONHBETHJkVHN5dlZzSWx3RTFOd0JMRURLZTdSRmM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.XtSn_j6Hte40gkkREYfvq9NdcRCPXBLTp4PKWG0Y7Pw	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 15:45:47.107902	2025-04-10 15:46:47.570417
15	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTUwOTcsImlhdCI6MTc0NDE5MDI5Nywic2Vzc2lvbl9pZCI6InE4cjlsOWZBWVBXUkpUcGc1Y09FWlpyQWRqQktlSnVTWlZUWHhOTU5xOGc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.kMkU8z02SpyqoYPd-T8cXNyk6fiuKxUPdcKmF7XoUT8	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 10:18:17.202418	2025-04-10 15:46:47.570417
16	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTUxMTAsImlhdCI6MTc0NDE5MDMxMCwic2Vzc2lvbl9pZCI6ImtYU201Y2ZDMHJ2RkQ1MjZDdnZxcWgxSENsOXB4dkZGLWxUalFrZFdEaUk9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.2csCtRQQFufD0XTXBYecoq7gWYePgoRqPATd8MyUyDQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 10:18:30.336451	2025-04-10 15:46:47.570417
17	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTYyNzcsImlhdCI6MTc0NDE5MTQ3Nywic2Vzc2lvbl9pZCI6ImdsTmExMWtYQW9FeldScnVjUFVzMWRXNWFIaWczZkRYMERmaXNYQ1dycXM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.tam0vO-ZezKBohzJQKZYv9ULPc_CTRyzHmSF6xney-I	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 10:37:57.505847	2025-04-10 15:46:47.570417
18	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTgwNTUsImlhdCI6MTc0NDE5MzI1NSwic2Vzc2lvbl9pZCI6IlhNbHRqclhBT01fR2FrYy1ybmp4T29JZFBJalhLbUw3SDlnY1k1ZEUwb2M9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.39ykFuCqtMNxzcb9iRRoRhruJSuZcofv8E0jU6Pon6g	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:07:35.321666	2025-04-10 15:46:47.570417
19	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTgwODcsImlhdCI6MTc0NDE5MzI4Nywic2Vzc2lvbl9pZCI6ImpQeDVUS0NyUVhKZGdiVW9IZGxoNnFSaW5nRElVQmt1THhYZnpLUEJDZnc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.hFRjD5EqTlu1JTYcGjLiu86pdhV96JsKOW08HG093cg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:08:07.58163	2025-04-10 15:46:47.570417
30	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkzODgsImlhdCI6MTc0NDE5NDU4OCwic2Vzc2lvbl9pZCI6Im1qdzdtam9DbEp2LWlSNmFhRU5VT0JlRXRkUkI5SDgtNjhkbHo1Qk9LbEU9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.ekPZ59HiS0uUl4Wv1KACV2721EdNl3ez98Ujd4fK1sI	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:29:48.624079	2025-04-10 12:01:22.597745
20	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTgxMTcsImlhdCI6MTc0NDE5MzMxNywic2Vzc2lvbl9pZCI6Ik9vNUltRHEzeWViTEZFVXprUnR1SHZxMzIyaHB3b2tJdlMyb3BtYnhwNDA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.uEisTeExGPNRYDLOGkxJsTpyHkE2woWAH0zb1FCyHYk	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:08:37.081537	2025-04-10 15:46:47.570417
69	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MjA4MjAsImlhdCI6MTc0NDIxNjAyMCwic2Vzc2lvbl9pZCI6IkZMSUN0Tl9RSVZMR1EzN1pGWjVuMnliekFQMFNRMEkzdUNwR055eDI3MXc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.BIeMopUQ-_wvIOi40r9bmUMT1JdvcAjyZ0vsxJAcERQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 17:27:00.387399	2025-04-10 15:46:47.570417
70	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MjE3ODYsImlhdCI6MTc0NDIxNjk4Niwic2Vzc2lvbl9pZCI6Ijg0ZVlxVHZnTnQwb1ZCbUIwYXR5STd4S1NEYUtJSnN4dTQzSldYbWprYkE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.B83PNMWK43T3UzPs6uDb7Wmr6Mqagbk4EKAIIRXPgRU	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 17:43:06.692048	2025-04-10 15:46:47.570417
71	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MjI1NDgsImlhdCI6MTc0NDIxNzc0OCwic2Vzc2lvbl9pZCI6IkZSbkVabkNXT2RkR05WeFBSUS1TbUNJWHE1dlNoMWNkZjlKOGJsbDROV2c9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.NDWyl-P-6D0TdCp11LFtuhZsKpOvpPewwpGPo0XxsWM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 17:55:48.534448	2025-04-10 15:46:47.570417
72	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MzMwODMsImlhdCI6MTc0NDIyODI4Mywic2Vzc2lvbl9pZCI6IkpPVU80cFZzT3ktZVdlNXI5Ukx1c0xkRXdZTlRvcmJjOUU1MW9LSXVNRE09Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.wzdQ7QdTXGOGLBUlooxHuCIIa8njR-SGqZFOCrWm2_4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 20:51:23.002871	2025-04-10 15:46:47.570417
73	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MzQwNDMsImlhdCI6MTc0NDIyOTI0Mywic2Vzc2lvbl9pZCI6InlOeFBpb2JJTU43YjNyb1Q5WlZWWHNncnJ6XzhnQjFIRXV0U3NVWDMxNWc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.-8jAx3MFh-6kurjZdUMp_BI8hzlmdmAs-kZFVamRjkY	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 21:07:23.507009	2025-04-10 15:46:47.570417
74	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MzU5NjUsImlhdCI6MTc0NDIzMTE2NSwic2Vzc2lvbl9pZCI6IkUxZkFuby1OcjJEbWZIMDZmNkpQOTNsazlpZkZQNklkano2UEFhUjVUVDA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.z1hBfoTqf-ZKwPgeuh6khVRMvLFtr3L409Of62kaihs	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 21:39:25.622384	2025-04-10 15:46:47.570417
75	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4Mzc5ODcsImlhdCI6MTc0NDIzMzE4Nywic2Vzc2lvbl9pZCI6Ink3WGItNm5pRWtkZGNESnBPLVpTeXRzQjlzUXEwanU4Yks2TjkyMlB4MDQ9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.ozN9V-eskAWso8ToXfTsU07hLBdIsJJ30rUOmwo2dSM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 22:13:07.423869	2025-04-10 15:46:47.570417
76	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4NDIxMjYsImlhdCI6MTc0NDIzNzMyNiwic2Vzc2lvbl9pZCI6IkRXNjk4Q0hBYy03b1VZeVA1NGwzU1pVenhERGR0d0dBMEczN0VfaDlLRDg9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.3KEY5UqA_3z-rkezJcauOD0XjYlg1l9jKQ65nSMiT6I	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 23:22:06.961811	2025-04-10 15:46:47.570417
79	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODAwNzAsImlhdCI6MTc0NDI3NTI3MCwic2Vzc2lvbl9pZCI6IkloUlNaMERwQ3RRbFJNNnJMaFFwYzM4bmxvV3dTdktFNkNhTnBqMmtDMXM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9._f6BqsONnpTOLMUo7Ff4hyZrsd7N-as9MWnUThn5hoY	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 09:54:30.715313	2025-04-10 15:46:47.570417
80	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODA1NzcsImlhdCI6MTc0NDI3NTc3Nywic2Vzc2lvbl9pZCI6InVyZ0hoSWEyUjFMU3M3S21SMXNGajFGNU54c3AxcEJsZVNhSlZUM0wxaVE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.5nAM8X0pPAAmrFkeNyVjjYUoXprA4dgTmrWpUXWzjQE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:02:57.88551	2025-04-10 15:46:47.570417
81	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODA4NDgsImlhdCI6MTc0NDI3NjA0OCwic2Vzc2lvbl9pZCI6IlJEMVdmcFd4bTFOcDBWVDExVUxjU1ZjLTBzeWxfTEdYejhkdmFyY2E0MjA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.NSn2TugayuWU9LGjM-3OkCmv1ufZr99J3awelIg5ZiM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:07:28.986869	2025-04-10 15:46:47.570417
82	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODA4ODksImlhdCI6MTc0NDI3NjA4OSwic2Vzc2lvbl9pZCI6IkVSNXFpNEV2bDNzNHBhLTA3SmhJUEItMzdVWHZkbE4zWXNWUElJRkpQUU09Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.zqvgM7tUDi3PlLKpcS1Y1Xt2Kp-rvOJ2-MacutwWhiQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:08:09.04942	2025-04-10 15:46:47.570417
83	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODA5NjIsImlhdCI6MTc0NDI3NjE2Miwic2Vzc2lvbl9pZCI6Ik94QlJwYWlTNDJGVTgxMXUtN1Ftc05oTkVIVlZ3U1RiWTVQamFIYjFPSWc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.uK1G-fBmPEJCnSH0Jop7uiwB3-HI0Zx9IvsMGiruf4Y	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:09:22.851683	2025-04-10 15:46:47.570417
84	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODE1ODIsImlhdCI6MTc0NDI3Njc4Miwic2Vzc2lvbl9pZCI6IjJzc0s4bzQ2VmVCblAzMHVVemNlYjROdEN6T3JMbjZkSkJ3dzAwQ25taHc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.RA-vCQZaK72UsJhWgPtC-ITVexuGlVkp0oUhohTL44Q	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:19:42.486506	2025-04-10 15:46:47.570417
85	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODIwMjYsImlhdCI6MTc0NDI3NzIyNiwic2Vzc2lvbl9pZCI6IkEyajdNd2pDMDZNMnZZMS1FRWtRSzVPWUNyS25GTlNsWkQ3QkdMZTlqSG89Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.ZEiH_MMy9OMj116ijEbYo7PZGCqNFMFWYvKN-tj7Bas	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:27:06.173702	2025-04-10 15:46:47.570417
58	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTIxMjcsImlhdCI6MTc0NDIwNzMyNywic2Vzc2lvbl9pZCI6Ii1NRXltalNUZk9OOGY2b3BGb2tUMVBSdERkSEhUY1pIVXQ5TUZXMFhUa1E9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.1AMaHvcL9ti3TpBGkXRDb79v1TLB2MAWwxV74mV40K0	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 15:02:07.673484	2025-04-10 15:46:47.570417
60	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTIxNTIsImlhdCI6MTc0NDIwNzM1Miwic2Vzc2lvbl9pZCI6Ii1LeUJDeVRXWVVqNnBvMzNNWk54a0x3c05QRE8xVFZjNlZLYlV5UTc1S1U9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.bTwYHzWBprPUFc55SdLydrohWeqLIK4TGUzAgHLkxkA	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 15:02:32.272693	2025-04-10 15:46:47.570417
61	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTI2NjIsImlhdCI6MTc0NDIwNzg2Miwic2Vzc2lvbl9pZCI6IjAxWGFOT29sUlN2QkFWQmdCX01pek5ndHF0MUFOMTV0SmRVZkRPeXdiOTA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.uCIxQwwOUGr5kzBCBrUBGvA2dsUsUzUAnO-_6Q1QS2U	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 15:11:02.702214	2025-04-10 15:46:47.570417
86	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODI0MTUsImlhdCI6MTc0NDI3NzYxNSwic2Vzc2lvbl9pZCI6IkNSNXZfWHBXczRBQ3YtdGlsTGtQQUF5b29ZcHhGdng3R1NtcXAzVXhpLU09Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.pwaLkqayGvbyilR_FDHa4H5rkL9UvcuFn-ZlIjpBRcY	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 10:33:35.157808	2025-04-10 15:46:47.570417
46	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4MDYsImlhdCI6MTc0NDE5NjAwNiwic2Vzc2lvbl9pZCI6ImFuLUhZdGV6ajVCSVFzaWQzZDdJcjctbmVETVJFU1ByNEJlQ2xWRUcwcE09Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.YmNTjHK2mwYeZ7jHbgEs8s5944nWora3EyCCSCbgquU	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:53:26.156456	2025-04-10 12:01:22.597745
87	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODY3MjUsImlhdCI6MTc0NDI4MTkyNSwic2Vzc2lvbl9pZCI6Imw0T0FOR195Um10TGpJQjM5d2VuVmpaVEF6bUJHYWtYTF9IZnJKSGJyWTg9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9._eXYLYdga5YGy1nu4D-R71DWRSSEMbEJayBAiydcJlc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 11:45:25.67084	2025-04-10 15:46:47.570417
101	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5NjM2MzUsImlhdCI6MTc0NDM1ODgzNSwic2Vzc2lvbl9pZCI6IjlvaHJMbk95X2ozQkZrd29EN0xzcVpuaXhrdlhsYUJFSjV3Z2RoTFpaZ1k9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.ltAWd9GJkinmyCEBCpolgH4K7tQr4doIjuOog67mjdc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 09:07:15.913741	2025-04-11 09:39:00.521697
104	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5NjU1ODMsImlhdCI6MTc0NDM2MDc4Mywic2Vzc2lvbl9pZCI6InZHcFdma21fOEJ6SlBpYWRodGJvb0NmOUdZQmc2eXk1UzFyMGFsU3RNQzQ9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.vznQUjsNSd7tgkKmAWBgNLkCUdeP1SziP9b33JRhXR4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 09:39:43.615987	2025-04-18 09:39:43.615434
116	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUzMTE1NjgsImlhdCI6MTc0NDcwNjc2OCwic2Vzc2lvbl9pZCI6InZTQTFYRVdMdWdqSDliTUlGVUVvWEZ4M25BVzUyNlIwRTBJWjRCNk5jYzA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.i7F8rGr0kdSrWqBT6gnrVjFsgYnhaEBjIt0mjh9d_Sg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-15 09:46:08.053505	2025-04-15 10:09:27.56676
62	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTMzMjUsImlhdCI6MTc0NDIwODUyNSwic2Vzc2lvbl9pZCI6ImJmTUtvU3dQWkszWUttV1VOcHhIVGNZa0RucnV1VWZpSnhJbWFTOWw0VGc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.osfVZu5xozl3cfA5wE-Fh8xzwOfxdlGRwJK__WaqCzQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 15:22:05.207372	2025-04-10 15:46:47.570417
63	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTM3OTcsImlhdCI6MTc0NDIwODk5Nywic2Vzc2lvbl9pZCI6ImtVcDZYZXhtX3ZPcVdaMVBZWGlFdm5iS05iTTRvVjR1VUtFd0g1cHRyeGM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.227rXdyvyXgCqrI4CN9RziovD8wtS9boA-IFShvgsEI	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 15:29:57.643151	2025-04-10 15:46:47.570417
64	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTQzMjksImlhdCI6MTc0NDIwOTUyOSwic2Vzc2lvbl9pZCI6IlVHVzNQTXhpOHcxRm5ZeC1CZENUc21idnpMVEV4VW14bGl1Yl9LaHNNVkE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.K-9oxuT_oQvh6Y0RkHxhLIwuMPRuWek2NCH34uodrT8	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 15:38:49.112083	2025-04-10 15:46:47.570417
93	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MDU0ODMsImlhdCI6MTc0NDMwMDY4Mywic2Vzc2lvbl9pZCI6Ik1fODBoYVFFVWZ3a21pelVYejhrSUM4eGpZU2N2aVI5SFgtMEtPdHFYSUE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.uaRXPcPOZS2RT0E-uqFUJqYPeAdJLU0qlkxfx5LNbEI	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 16:58:03.239813	2025-04-10 17:10:20.021815
102	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5NjU1NTIsImlhdCI6MTc0NDM2MDc1Miwic2Vzc2lvbl9pZCI6IlEtMVVZM3RvNmV4M3VNeU9FY2l2LUd6VDRvZjJZRF85b3djSGEtM1ZWN2s9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.fR7EjQUVwMVjt8PdZY-xgo2SdkbRLx8lydFgOoDfhBM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 09:39:12.816321	2025-04-11 09:39:23.087185
103	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5NjU1NjcsImlhdCI6MTc0NDM2MDc2Nywic2Vzc2lvbl9pZCI6IjJ6UkxPbnJRMWRWYlI0MmR4cHQ2RmFFMEJzdEJhbHBfM0QzMnNkQm1TU289Iiwic3ViIjoxNiwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.fwVYTE-ppmeBQSF9dHHureskX4ILsWF9diu0XKt3p6g	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 09:39:27.965702	2025-04-11 09:39:42.486194
117	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUzMTI5NzgsImlhdCI6MTc0NDcwODE3OCwic2Vzc2lvbl9pZCI6InduSmQ5RmEyVEtQR0NIX2c3eE8xZ2JZTnJUdmZmSmc2YmE4dzhhM2NoSm89Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.0vHUP4j4Raz1qgjA6fWZ_NC2LYcUbzORFK02Q9CLyl4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-15 10:09:38.733465	2025-04-22 10:09:38.733465
22	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTg5NjgsImlhdCI6MTc0NDE5NDE2OCwic2Vzc2lvbl9pZCI6IlJydG9LZTl1OTN3TE4yWDd6T094ZHJGcWo0X3h3WHVrYXVVM1ZncE04b0k9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.TjrxSgG6wjhAZ7vi_5OxcdUZmoczZ80dVBPUEe2rvQ0	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:22:48.359739	2025-04-10 12:01:22.597745
23	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTg5ODcsImlhdCI6MTc0NDE5NDE4Nywic2Vzc2lvbl9pZCI6IkthQW5FRmFzZ2pLaGtFUk1HbjlUcnR5Y3dZYTZUVHJwTG16VTRuZ2NfNHc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.pp67i4yzdWq2yyQwrntJG6-sy5M0XNqei5ujFseI1vQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:23:07.909159	2025-04-10 12:01:22.597745
94	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MDYyMjIsImlhdCI6MTc0NDMwMTQyMiwic2Vzc2lvbl9pZCI6InZaZUlCNTVrOVFZSjhubXptaTdzdlAzd190ZTY2MnBtZ3JNU0pGVHh0SXc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.qQkdFaN-Altac-m6FNJp96rgxmR28IK0LQIFaJiDIA0	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 17:10:22.039117	2025-04-10 20:22:00.056102
105	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5NzMxNDEsImlhdCI6MTc0NDM2ODM0MSwic2Vzc2lvbl9pZCI6IlpDbjZkNWQwMU1ZaC1vbWJtUzdwdndEWmY2QW5IYnVhal8taXNqVWx3d1E9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.ikjvof_du3ZIg2BDyk28zL9mO7vvK1DTyKEP7lEOBe4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 11:45:41.322532	2025-04-11 22:07:04.117839
65	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTY0MjAsImlhdCI6MTc0NDIxMTYyMCwic2Vzc2lvbl9pZCI6ImtzYjExZFpyNFl6ZmtiOGc3N051X2Z6eUV6M3NfdUpvdHVCVWJqVGlXSWM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.DrlRRkLc0zkM5r4WrSSACmjI2Z95CpTIP34fg-6SpS4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 16:13:40.248232	2025-04-10 15:46:47.570417
66	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MjAyNTcsImlhdCI6MTc0NDIxNTQ1Nywic2Vzc2lvbl9pZCI6ImZZYUVHNEdzRGtsUF9XVGJNb2JKcW5OSnkzVkZCUGRSUHVjVmtrSTNWcXc9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.NQiCrof3_vOVOWuMXrFrFS8HhUcxwyTMdYgWMYBY-yg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 17:17:37.465573	2025-04-10 15:46:47.570417
67	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MjA0MzgsImlhdCI6MTc0NDIxNTYzOCwic2Vzc2lvbl9pZCI6Ik9rWXBEQ1dPSEhkNWtFTzNlaGdTRF8xdXpBU2trQXBEWFFVZEg0cGltUGM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.sT_lvaAB36YnpFQFawSenttqXf8Va38U2tkEs44rilc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 17:20:38.956128	2025-04-10 15:46:47.570417
95	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MTc3MjIsImlhdCI6MTc0NDMxMjkyMiwic2Vzc2lvbl9pZCI6IkxEM3BHUlBDNDV3dXpjY3hjd2Z5eW1xdWJlS0NxOS0ydGN3dDA3ZEFNM1E9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.N7Z8caKaG2-LZDHY8KdtMt1ELP8Mqvl5QMk1TCfaQu4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 20:22:02.134785	2025-04-10 21:50:53.917587
106	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTA0MzEsImlhdCI6MTc0NDQwNTYzMSwic2Vzc2lvbl9pZCI6ImppN2ctRUFTZS00M3NrQnkweWpuT3FPVXlkZjZOd2JZaUVWcFM4YVczTTA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.RlXdlsBA-Iq6lnU91P3IhTQK0kQYh5bdc468kIxdzfY	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:07:11.47913	2025-04-11 22:07:26.667482
108	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTA3MzEsImlhdCI6MTc0NDQwNTkzMSwic2Vzc2lvbl9pZCI6IktRSXhUWlhoaFNSMWk1WG96R3lBZU95czlmbUdGaEdmU1UtRlhOX01pWUk9Iiwic3ViIjoxNiwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.KWj3SQkqqFei_DNAaxNv5Az8JFh40Yqd5tjDBq8wQZM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:12:11.65482	2025-04-11 22:18:30.02118
110	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTExMjMsImlhdCI6MTc0NDQwNjMyMywic2Vzc2lvbl9pZCI6IjE5eWVWUVVQWHI5ODUtZ3BYbE1pemItc0Z1c2NMR0FFWThoOVVLYnNMVE09Iiwic3ViIjoxNiwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.B_vM7s-dsGG42P8F4216grerrDgH7fv7keOUW9tTLps	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:18:43.874299	2025-04-11 22:18:56.467384
111	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTExMzcsImlhdCI6MTc0NDQwNjMzNywic2Vzc2lvbl9pZCI6InJLZkJhSndIWnZQNVkxbXFrVktmZmNuaklBUG56OXJ2WnlPdFNDTDd3VEE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.unPaaBQp56E6qiJqHsMTFxCsXEu2C8wi716niHXC2Xg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:18:57.862937	2025-04-11 22:19:27.029423
113	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTExODUsImlhdCI6MTc0NDQwNjM4NSwic2Vzc2lvbl9pZCI6IkNuV0duWlNFN2hZalB2S1JzNnk1OUw1clNick5QMEoxSTNEZVVxRkhYSFE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.1SHjHj6IeWid3lPmHL2Lc6G2SKBfIQrbXAiqvHfLUcU	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:19:45.228149	2025-04-18 22:19:45.228149
53	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDg1MjcsImlhdCI6MTc0NDIwMzcyNywic2Vzc2lvbl9pZCI6IlF3SjE2RTk4eUZSVW5JRkw2S2ttV1dFNFZBMm9mWWROamoxeXVvZzlLVkU9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.YbFUedRE9T1AXnSX2EgoVZk0Gwb4hjVHfTtx_1KngNc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 14:02:07.680242	2025-04-10 12:01:22.597745
68	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MjA3MjAsImlhdCI6MTc0NDIxNTkyMCwic2Vzc2lvbl9pZCI6IkNXMUtKelBHQjFHN3pxUV81Z05Hdnl4UzNhTllaSmNVRnRQUjNkdGFPSE09Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.YfhsoR9OiU_mmohqbP7YwQ64aTHQjy6eGJWw3Ez0e3c	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 17:25:20.67949	2025-04-10 15:46:47.570417
96	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MjMwNTgsImlhdCI6MTc0NDMxODI1OCwic2Vzc2lvbl9pZCI6IkJCMnFZM1VqbVBYOVZyZzBRTTBObTlSZGRYZFdnWERWZVJ4ckpTX0dmNkE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.3Rt8sMJ_FPc8zQHSrl9rRC7lKGmKkSn1BOA-_e550TE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 21:50:58.283221	2025-04-10 22:05:53.533394
97	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MjM5NjMsImlhdCI6MTc0NDMxOTE2Mywic2Vzc2lvbl9pZCI6IlpyRmhqOHNQdF9Gc2xmT2xpLVQ3SkNYU0F5ZVJXNTVJZkJURUZzMktyUkk9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.kyHMXRa18xI0S37ciVH-K37Px7mWSvqjt4CIYo9h3gw	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 22:06:03.021769	2025-04-10 22:14:02.64061
107	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTA0NTAsImlhdCI6MTc0NDQwNTY1MCwic2Vzc2lvbl9pZCI6IjlMQ1RhR0xLQVdDbkFveWNhaG5hOWwxNG53aXd4bnZtaGMzWi1NSy01cDA9Iiwic3ViIjoxNiwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.FxUG413kIlptyhL7jNxaJLOlVO7bcYcqR_9WfDiZ-kg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:07:30.212631	2025-04-11 22:12:07.943302
109	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTExMTIsImlhdCI6MTc0NDQwNjMxMiwic2Vzc2lvbl9pZCI6InkyQzZaa2JrRXRuWk9lSFo2OGxMUWhLd2JZSlN3SmNQNVlxLWVLeHVvZkU9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.EXgwH3eSFpiJMLBXOnB4hWHV-khsjHsWBoNsf5bsn-o	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:18:32.740869	2025-04-11 22:18:39.400013
112	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUwMTExNzMsImlhdCI6MTc0NDQwNjM3Mywic2Vzc2lvbl9pZCI6IjZ2VDlsV2FDbXU2TFk2MkNzT1dJeUVsNzIzOU5zZkxyOVV3bWN3TkloZXc9Iiwic3ViIjoxNiwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.lNtOkf0U_riwDT9sgPShMgjk4Cfz2Oorp3BpXotHoXg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-11 22:19:33.524409	2025-04-11 22:19:42.785056
77	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4Nzc5MTQsImlhdCI6MTc0NDI3MzExNCwic2Vzc2lvbl9pZCI6ImJHUTZCX0NRSFZzTTFKREdVNTZsWjUxbWFMUG5RTWJzVm1adG9hZ2l6OHM9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.VPchW_xCEho5LrUrTULro02JdRjirajWsge2cOhObJU	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 09:18:34.574367	2025-04-10 15:46:47.570417
24	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTg5OTYsImlhdCI6MTc0NDE5NDE5Niwic2Vzc2lvbl9pZCI6IjhTMVBBNk5ualBhZFNmNVhjdXJqTVB5OElMelh6ZXhleUpJcGNnOURyLWM9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.5iiCqjdRuEmG4rVUWjvCFxlEYiX4r-wJgoZ1T_bJjL0	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:23:16.559245	2025-04-10 12:01:22.597745
78	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4Nzk4MDksImlhdCI6MTc0NDI3NTAwOSwic2Vzc2lvbl9pZCI6IlRqSy12azhzQnBmZzZXUmpMLVE5a1Qzek1qcnZrOVJDUjFhcVFtZEJUbjA9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.aBsVXdnNZ5VFiS7LMGIM4mW2SRD4sO0yrtX3wDrVaCQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 09:50:09.612797	2025-04-10 15:46:47.570417
25	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkwNzcsImlhdCI6MTc0NDE5NDI3Nywic2Vzc2lvbl9pZCI6Im41UFU1ODhtTWIzRzhMYnBlNkVEbXcwVi1fd1JTeFpPMXdtMlRZOUNzZjQ9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.REgk-SmGCxaGO1Wuyu1bRhUF8-MQ7myUA-DxdjReIP4	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:24:37.787296	2025-04-10 12:01:22.597745
26	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkxOTUsImlhdCI6MTc0NDE5NDM5NSwic2Vzc2lvbl9pZCI6Ik8yZ3BDNGxMRjJPbER0OHhCWnNSdzQxcDFnTUcyREY5RXNXMFBlZTV0ZjQ9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.zzg-RuNO9eZE30f49x9rcXPyoG8Z9iHxeHVSGzLrdvA	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:26:35.968763	2025-04-10 12:01:22.597745
27	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkyNzIsImlhdCI6MTc0NDE5NDQ3Miwic2Vzc2lvbl9pZCI6IlRMLWYyTEJQaFZ2cElsa1A4UTdKZzNWdmlxdnZWVWxUb04tcUpZNmc3OFU9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.0NbsEt07dkgToPsF5ujUCJd8ujDo3YapooyLw1woUMY	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:27:52.911198	2025-04-10 12:01:22.597745
28	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkzMTMsImlhdCI6MTc0NDE5NDUxMywic2Vzc2lvbl9pZCI6IktBUlJZbk85SVNCZWFsR25CdGZuS0J1NWNJNnk4NG1zR1VGOWFuTG9qcHc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.IHh-x8AACdrqLZMrbsnRrXGe_Abuju8VW3IlNhC5jwE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:28:33.614763	2025-04-10 12:01:22.597745
29	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkzNjEsImlhdCI6MTc0NDE5NDU2MSwic2Vzc2lvbl9pZCI6IjFGYU1JWE0xZm0wZ2cwbTBvOG1oVmNyTHhGQi0wXzZ2RmlNa0ZmZ3V2QjA9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.OTUGEEUpJvICuANNsiPPwBbO3zt6aNfmaK0E5cgvDdc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:29:21.5612	2025-04-10 12:01:22.597745
31	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkzOTEsImlhdCI6MTc0NDE5NDU5MSwic2Vzc2lvbl9pZCI6IlR5ZS1IdjRmUFVXX0NzM01FT0F2aG93Mk9fMGd0TjF5dFR5ZlZVdFE2Tk09Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.QGf8CllOUk0rjbT7qIl7u3NhL_auzP-ErVmz8qrIXaE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:29:51.848599	2025-04-10 12:01:22.597745
32	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTkzOTQsImlhdCI6MTc0NDE5NDU5NCwic2Vzc2lvbl9pZCI6InBaRTlMU1FXVU05WWxtVVBSOG5wRjF0TVh1cTVCamJTSEFtLWE1cXU5dTQ9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.d-4pW8Y2UDFck6VbleXICMcF2NIkU4hP6BZ_Dlo-BBs	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:29:54.403326	2025-04-10 12:01:22.597745
33	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk0MDMsImlhdCI6MTc0NDE5NDYwMywic2Vzc2lvbl9pZCI6IndHT2xYbzZRTnZsUDlrZkNyd212cTdCRU5iblpuRmRBd0FramZmMmVmaGc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.aQlAiZltFy7s96h2-c4Pb8kFWr2pO42cQCOA5wvN-Ys	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:30:03.785122	2025-04-10 12:01:22.597745
34	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk0MDYsImlhdCI6MTc0NDE5NDYwNiwic2Vzc2lvbl9pZCI6IkwtcHl1WjRmbTdsVWt5VVRLWDhyWjFZNjQ2UUJxUUY2M3F6RmltREFKbW89Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.n980jH1fV-0EKNGZ58UZILhcAeLFK51wkudvQ4pBJ8M	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:30:06.574922	2025-04-10 12:01:22.597745
35	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk0MzksImlhdCI6MTc0NDE5NDYzOSwic2Vzc2lvbl9pZCI6IlZMdlVuWWF3SnVxVlUzNFdtYTNXLTJudWVpdkFSTlh3b1FuUmNjUml6Ulk9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.gYsD2bqAkxprYRww_GcWunIiT4BOyfTBkjWnDWk6gR0	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:30:39.411601	2025-04-10 12:01:22.597745
36	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk0NDIsImlhdCI6MTc0NDE5NDY0Miwic2Vzc2lvbl9pZCI6Ik9qUkp0OHFib28tWk9wMnJEeTJNb2JrREFmQl9XeDkxek1UdlVQTjJJLTA9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.d6J94FSAdODfoSTU0G0YpYwKUG3kg3r2fgiU9epKoSA	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:30:42.348676	2025-04-10 12:01:22.597745
37	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk1MzEsImlhdCI6MTc0NDE5NDczMSwic2Vzc2lvbl9pZCI6InZTTTNGdDFpeFJvNWQ4R0VUeFJBLUF6aE5vUGo2aFZGb2plOC14WmZKWGs9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.ON4JlamIGgt0Y3-mKET2-KV8jc-iv0IIglpfqEpEG0M	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:32:11.673031	2025-04-10 12:01:22.597745
38	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk1NDIsImlhdCI6MTc0NDE5NDc0Miwic2Vzc2lvbl9pZCI6IjlXN0puYWo2dDl3V1RXaWJrSk5zbm9DcFUyZjNZY2xhSGQ1ZURSX3VfOFk9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.xZoHDZ7NjF3TYo3i_zItmwWO-BEK9JPUttjoSq0RrbQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:32:22.910703	2025-04-10 12:01:22.597745
39	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk2MjYsImlhdCI6MTc0NDE5NDgyNiwic2Vzc2lvbl9pZCI6IjYtdDUzTGwzV1NWQzl6MWFIUkZpTldFbnVDcHJIRTAyWlBHYzRudXpidkk9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.PKABBDJLwR4-Eg-zwyCY55VMyi8B4Slb_d2HW4geK9k	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:33:46.035001	2025-04-10 12:01:22.597745
40	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk3MjQsImlhdCI6MTc0NDE5NDkyNCwic2Vzc2lvbl9pZCI6Ikp2ZklTZ2NpZXdveHMtb1cyTWY4X1lGZzg3YkxuNm1zaklMUDRGMXB1QTg9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.LP4GY9k-Slds-rppEm2AqeW0K3KPiC4Sg1WctCdSdbs	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:35:24.060939	2025-04-10 12:01:22.597745
41	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk3NDIsImlhdCI6MTc0NDE5NDk0Miwic2Vzc2lvbl9pZCI6IjVWal9YOTliLS1SSHNJR1pNZVkxNUtaa05jWjFNNW5UajB5MFpaTmt4OU09Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.WvEmtKCLrcljGaxLfpU306ISu3KKqh-bnFXMHPjU5LQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:35:42.560536	2025-04-10 12:01:22.597745
42	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ3OTk5NDksImlhdCI6MTc0NDE5NTE0OSwic2Vzc2lvbl9pZCI6IkpjdlJNRDhTVWltcktMZXVRRXlPdkRmVnNORjJUUy1nTlo5NFpoaVFvR0E9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.4QozYk6pbTqnEnPyhna1rvyt4-LbOjgL-ogLdLTvBAc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:39:09.276109	2025-04-10 12:01:22.597745
43	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDAyMDMsImlhdCI6MTc0NDE5NTQwMywic2Vzc2lvbl9pZCI6Im9NODFWa0FnUjZEY1lQVUhjbXJEV0F6U24wU0NCRUdWemN6R21yV2hCQmc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.dympXFEWPBasIqzBtigXwi0whCCmWrSOBkT7lIqNsUM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:43:23.636619	2025-04-10 12:01:22.597745
44	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA1MDEsImlhdCI6MTc0NDE5NTcwMSwic2Vzc2lvbl9pZCI6Iko3bWlTYW9JQmFsUVZQS2JCbGsyZnNaZzB4YlVwd20zMklWMHZJUHMtLWc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.Q7mXaRuI7YN-RmrwxM8EW3MDas6-0MIBK0Awfxn6SDA	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:48:21.485026	2025-04-10 12:01:22.597745
45	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4MDIsImlhdCI6MTc0NDE5NjAwMiwic2Vzc2lvbl9pZCI6Ik0zQkxQMUlFQXdGNkg4bXRFNWdnR2p4cjBOZ1VJME5mRFU2ZEZsNThNdVk9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.WTVuqnG7YmxxEW6mHJe0-Y3puSg-eVAEWiI9fjWrRsc	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:53:22.296829	2025-04-10 12:01:22.597745
47	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4MTAsImlhdCI6MTc0NDE5NjAxMCwic2Vzc2lvbl9pZCI6IkU2SWlCZmZ0VU1tUjVjZGVDMWVWNklmT1ppTjJMRWZuQjlaUjVSNWtCdHc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.JJmA8LmYfNAAaFbyd1cFpm0bYU3WveZq5ETi1sjjyhw	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:53:30.206852	2025-04-10 12:01:22.597745
48	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4MTMsImlhdCI6MTc0NDE5NjAxMywic2Vzc2lvbl9pZCI6ImpWZlpJX0ZJa0E1bkF5WUowNmNuYThibTU0am94WXBBWmpjRHhvTDVrQnc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ._sXK-XewwKwQijXKEk8ac1Q40iN_3qtxurMLHBzbG18	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:53:33.108376	2025-04-10 12:01:22.597745
49	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4MTYsImlhdCI6MTc0NDE5NjAxNiwic2Vzc2lvbl9pZCI6IktUc0g4ZWw0N2RFNGx6aE9lV2xmbEJDTDYxV3lZVFhGYUdOUmVUeXRKaVE9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.Ntd8P7fbo2vklPoaauuRtW20KV399ob-dovSS5ahAFk	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:53:36.106448	2025-04-10 12:01:22.597745
50	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4MTksImlhdCI6MTc0NDE5NjAxOSwic2Vzc2lvbl9pZCI6IjMybU05S05Ma213R0FXblZSRmdtekE3Mk02NHdscVhEN2p4dW9hWDVNZEE9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.iLvr7UrIc7TexIMfsZPtJ-6NrQnBSsoJd7vrA7BhIJE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:53:39.060222	2025-04-10 12:01:22.597745
51	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDA4NzMsImlhdCI6MTc0NDE5NjA3Mywic2Vzc2lvbl9pZCI6InRWZnVSNzRETkxKbGE0blpKYURXMDhDeF9xN1Q5TjlnbDZacXNZV3NYU3c9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.GOjUv8EeDFPfj9kOeM9AR5FrWQymrDjz5Cf0CbFYwkQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 11:54:33.536164	2025-04-10 12:01:22.597745
52	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDgyMzEsImlhdCI6MTc0NDIwMzQzMSwic2Vzc2lvbl9pZCI6IlNxZlRiblhEVU9lVy1PU092SnRfTG9BMGtmQWZJa3ZCZlhjT2dfSnFwcG89Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.UFtex-BHv4PK6Jo5n8haJ3obVRjISMs2WJLElQa2wsQ	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 13:57:11.509454	2025-04-10 12:01:22.597745
54	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDg1NTgsImlhdCI6MTc0NDIwMzc1OCwic2Vzc2lvbl9pZCI6Im8wbmlHeXBSU1FUWmk5akNCam1qZC16THJyTEhTbmdlczQtLWVNNVZuOFE9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.TZW9ooPZARRtMj3Fey4hQQAgWX3it9aUKztYlCA0ZSM	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 14:02:38.918285	2025-04-10 12:01:22.597745
55	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MDg3ODgsImlhdCI6MTc0NDIwMzk4OCwic2Vzc2lvbl9pZCI6IlJzc3R2SnhEUjBBaDBmeG83ZE9vcDlDOUlNanBOVDhfZUtqdlpUajFFSFE9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.YXRgKRcsKninykAXGX2zk2AOlRZOWnh8TvD_jTsTp_0	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 14:06:28.846064	2025-04-10 12:01:22.597745
56	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4MTEyODEsImlhdCI6MTc0NDIwNjQ4MSwic2Vzc2lvbl9pZCI6ImJWb3NONEduRllKN2FwWHI5LUd4RWJVUElpZElyV3pKS05RYkFjUldoTms9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.cv7pi1U1n1dREGtRTaXF3rENJG30tvoIexyGcHWmTsE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-09 14:48:01.483275	2025-04-10 12:01:22.597745
88	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODc2MDIsImlhdCI6MTc0NDI4MjgwMiwic2Vzc2lvbl9pZCI6Ikp3YnI5aGx6OF9Tb2Mzd00tWS10YVFGa002OVdDRFVvMm1mWnB3Q2FUNXc9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.ixTYro3m5vzdlK8VqZcC2UR0Gj8ATLogZxXnmSr9HgE	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 12:00:02.745379	2025-04-10 12:01:22.597745
89	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ4ODc2NzMsImlhdCI6MTc0NDI4Mjg3Mywic2Vzc2lvbl9pZCI6IlMxVngwcFdpblUxWmVLQkJKTmMxVm1CUDU3THhGenVoSVJFc1dwYV9takE9Iiwic3ViIjoxMCwidG9rZW5fdHlwZSI6InJlZnJlc2gifQ.lCYxrRxNU197BQv-ycJyjuIZmAaFPmfu-jCMaQCJ-4c	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 12:01:13.622365	2025-04-10 12:01:43.233973
98	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDQ5MjQ0NDQsImlhdCI6MTc0NDMxOTY0NCwic2Vzc2lvbl9pZCI6InBMdzZUWXU5blpHd1ZNQ0F3bEU1cS14NHdubVdqVndRNXp2THBLYUM1WlE9Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.zSyUPt6GDy0-rYVa7kLm9AKtl7qs1T9tmxkF5taLBUU	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-10 22:14:04.436488	2025-04-10 23:21:16.189796
114	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDUyMjU5NDIsImlhdCI6MTc0NDYyMTE0Miwic2Vzc2lvbl9pZCI6IjlUUzgzNmxnSEZzelpLclYtT2Z4bldkbkwwNC04dS13aXF2SHJPZHNpcE09Iiwic3ViIjo5LCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.yUDG3pUjq03bg8_ReW-PfRuZeL_YdX_2ceRIqmZQpHg	127.0.0.1	Navegador Web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-14 09:59:02.422856	2025-04-14 09:59:08.125641
\.


--
-- Data for Name: status_utilizadores; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.status_utilizadores (utilizador_id, online, ultima_atividade, ip, dispositivo) FROM stdin;
14	f	2025-04-10 22:21:32.082492+00	127.0.0.1	Navegador Web
10	f	2025-04-10 11:01:43.238556+00	127.0.0.1	Navegador Web
12	f	2025-04-10 14:14:06.144492+00	127.0.0.1	Navegador Web
9	t	2025-04-15 10:10:18.499761+00	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0
16	f	2025-04-11 21:19:42.788113+00	127.0.0.1	Navegador Web
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.tags (id, plc_id, nome, db_number, byte_offset, bit_offset, tipo, tamanho, subsistema, descricao, ativo, update_interval_ms, only_on_change) FROM stdin;
1	1	bit	13	0	0	Bool	1	\N	\N	t	1000	f
2	1	bit_1	13	0	1	Bool	1	\N	\N	t	1000	f
3	1	bit_2	13	0	2	Bool	1	\N	\N	t	1000	f
4	1	bit_3	13	0	3	Bool	1	\N	\N	t	1000	f
5	1	bit_4	13	0	4	Bool	1	\N	\N	t	1000	f
6	1	bit_5	13	0	5	Bool	1	\N	\N	t	1000	f
7	1	bit_6	13	0	6	Bool	1	\N	\N	t	1000	f
8	1	bit_7	13	0	7	Bool	1	\N	\N	t	1000	f
9	1	bit_8	13	1	0	Bool	1	\N	\N	t	1000	f
10	1	bit_9	13	1	1	Bool	1	\N	\N	t	1000	f
11	1	bit_10	13	1	2	Bool	1	\N	\N	t	1000	f
12	1	bit_11	13	1	3	Bool	1	\N	\N	t	1000	f
13	1	bit_12	13	1	4	Bool	1	\N	\N	t	1000	f
14	1	bit_13	13	1	5	Bool	1	\N	\N	t	1000	f
15	1	bit_14	13	1	6	Bool	1	\N	\N	t	1000	f
16	1	bit_15	13	1	7	Bool	1	\N	\N	t	1000	f
17	1	int	13	2	\N	Int	1	\N	\N	t	1000	f
18	1	word	13	4	\N	Word	1	\N	\N	t	1000	f
19	1	string	13	6	\N	String	1	\N	\N	t	1000	f
20	1	real	13	262	\N	Real	1	\N	\N	t	1000	f
\.


--
-- Data for Name: tokens_recuperacao; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.tokens_recuperacao (id, utilizador_id, token, criado_em, expira_em, usado) FROM stdin;
\.


--
-- Data for Name: utilizadores; Type: TABLE DATA; Schema: public; Owner: danilo
--

COPY public.utilizadores (id, nome, email, senha_hash, perfil, estado, tentativas_login, ultimo_login, criado_em, atualizado_em, foto_perfil, dois_fatores_ativo, segredo_dois_fatores) FROM stdin;
10	danilo henrique 	danilo@rls.pt	$argon2id$v=19$m=65536,t=1,p=4$5Swjw9SYOTMYhhupxHYqzA==$4pV+abVm4ReksaYeFTev5yiAKaSCypqjsr3LH1O57KI=	Administrador	Ativo	0	2025-04-10 12:01:13.618543	2025-04-09 10:12:26.72304	2025-04-10 12:01:13.619557	/uploads/avatars/user_10_1744206570.png	f	
12	henrique	henrique@rls.pt	$argon2id$v=19$m=65536,t=1,p=4$OMTsDQzVR5freguwyTUqZw==$0D+Uz62rA4UScpTta+x0t7g+msnJOe+zByS4zwuKJ2Y=	Utilizador	Ativo	0	2025-04-10 15:13:45.253507	2025-04-10 15:12:35.790739	2025-04-10 15:13:45.254542		f	
16	Suport	suporte@rls.pt	$argon2id$v=19$m=65536,t=1,p=4$QIKBtxPnCjivS0OQeu08Fw==$a12/U8PNZ38PloDLREnxl9vASoCySLqXj8Mkd2GZBfw=	Utilizador	Ativo	0	2025-04-11 22:19:33.520419	2025-04-11 09:38:42.48628	2025-04-11 22:19:38.633427		f	
4	Administrador	admin@dev.com	$argon2id$v=19$m=4096,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA	Administrador	Ativo	1	0001-01-01 00:00:00	2025-04-07 13:45:26.491987	2025-04-11 10:50:53.491183		f	
1	Administrador	admin@edp.pt	$argon2id$v=19$m=4096,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$2hf/n2v3G5jLyrpZl3rMbEUkDSpp0qkI5k4tcssJMpo	Administrador	Inativo	3	0001-01-01 00:00:00	2025-04-07 10:42:50.643328	2025-04-11 10:52:52.245798		f	
8	Admin	admin@exemplo.com	$2a$10$JiZFKzAqLsV4gOAQvE9ADOOHAvAqD.AIVlnH4VxEb7V2NYVptIaoa	Administrador	Ativo	5	\N	2025-04-08 15:17:51.268011	2025-04-08 15:17:51.268011	\N	f	\N
9	Administrador	admin@rls.pt	$argon2id$v=19$m=65536,t=1,p=4$Vgl2Bedizzbx9sX1CTzVXg==$dQrPG0JZENZV2//wYfzxwXK0vW9Blgv4dvLOlnULKF0=	Administrador	Ativo	0	2025-04-15 10:09:38.730458	2025-04-08 16:26:45.610231	2025-04-16 09:50:44.985274	/uploads/avatars/user_9_1744363063.jpg	f	
14	danilo henrique silva	dan@rls.pt	$argon2id$v=19$m=65536,t=1,p=4$TZX5HARpz1CetrD/8tfmeQ==$q5APi69EZklEaCdxhT0MgvKHknvYPB7e3gw5FhlaPDY=	Utilizador	Ativo	0	2025-04-10 23:21:23.473992	2025-04-10 23:21:11.278642	2025-04-10 23:21:23.473992		f	
\.


--
-- Name: configuracoes_sistema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.configuracoes_sistema_id_seq', 11, true);


--
-- Name: logs_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.logs_auditoria_id_seq', 273, true);


--
-- Name: permissoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.permissoes_id_seq', 17, true);


--
-- Name: plcs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.plcs_id_seq', 1, false);


--
-- Name: sessoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.sessoes_id_seq', 117, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.tags_id_seq', 1, false);


--
-- Name: tokens_recuperacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.tokens_recuperacao_id_seq', 1, false);


--
-- Name: utilizadores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: danilo
--

SELECT pg_catalog.setval('public.utilizadores_id_seq', 16, true);


--
-- Name: configuracoes_sistema configuracoes_sistema_chave_key; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.configuracoes_sistema
    ADD CONSTRAINT configuracoes_sistema_chave_key UNIQUE (chave);


--
-- Name: configuracoes_sistema configuracoes_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.configuracoes_sistema
    ADD CONSTRAINT configuracoes_sistema_pkey PRIMARY KEY (id);


--
-- Name: logs_auditoria logs_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_pkey PRIMARY KEY (id);


--
-- Name: perfil_permissoes perfil_permissoes_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.perfil_permissoes
    ADD CONSTRAINT perfil_permissoes_pkey PRIMARY KEY (perfil, permissao_id);


--
-- Name: permissoes permissoes_modulo_acao_key; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.permissoes
    ADD CONSTRAINT permissoes_modulo_acao_key UNIQUE (modulo, acao);


--
-- Name: permissoes permissoes_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.permissoes
    ADD CONSTRAINT permissoes_pkey PRIMARY KEY (id);


--
-- Name: plcs plcs_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.plcs
    ADD CONSTRAINT plcs_pkey PRIMARY KEY (id);


--
-- Name: preferencias_utilizadores preferencias_utilizadores_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.preferencias_utilizadores
    ADD CONSTRAINT preferencias_utilizadores_pkey PRIMARY KEY (utilizador_id);


--
-- Name: sessoes sessoes_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.sessoes
    ADD CONSTRAINT sessoes_pkey PRIMARY KEY (id);


--
-- Name: sessoes sessoes_token_key; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.sessoes
    ADD CONSTRAINT sessoes_token_key UNIQUE (token);


--
-- Name: status_utilizadores status_utilizadores_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.status_utilizadores
    ADD CONSTRAINT status_utilizadores_pkey PRIMARY KEY (utilizador_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tokens_recuperacao tokens_recuperacao_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tokens_recuperacao
    ADD CONSTRAINT tokens_recuperacao_pkey PRIMARY KEY (id);


--
-- Name: tokens_recuperacao tokens_recuperacao_token_key; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tokens_recuperacao
    ADD CONSTRAINT tokens_recuperacao_token_key UNIQUE (token);


--
-- Name: utilizadores utilizadores_email_key; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_email_key UNIQUE (email);


--
-- Name: utilizadores utilizadores_pkey; Type: CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.utilizadores
    ADD CONSTRAINT utilizadores_pkey PRIMARY KEY (id);


--
-- Name: idx_plcs_ativo; Type: INDEX; Schema: public; Owner: danilo
--

CREATE INDEX idx_plcs_ativo ON public.plcs USING btree (ativo);


--
-- Name: idx_preferencias_utilizadores_idioma; Type: INDEX; Schema: public; Owner: danilo
--

CREATE INDEX idx_preferencias_utilizadores_idioma ON public.preferencias_utilizadores USING btree (idioma);


--
-- Name: idx_status_utilizadores_online; Type: INDEX; Schema: public; Owner: danilo
--

CREATE INDEX idx_status_utilizadores_online ON public.status_utilizadores USING btree (online, ultima_atividade);


--
-- Name: idx_tags_plc_id; Type: INDEX; Schema: public; Owner: danilo
--

CREATE INDEX idx_tags_plc_id ON public.tags USING btree (plc_id);


--
-- Name: preferencias_utilizadores fk_preferencias_utilizador; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.preferencias_utilizadores
    ADD CONSTRAINT fk_preferencias_utilizador FOREIGN KEY (utilizador_id) REFERENCES public.utilizadores(id) ON DELETE CASCADE;


--
-- Name: status_utilizadores fk_status_utilizador; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.status_utilizadores
    ADD CONSTRAINT fk_status_utilizador FOREIGN KEY (utilizador_id) REFERENCES public.utilizadores(id) ON DELETE CASCADE;


--
-- Name: logs_auditoria logs_auditoria_utilizador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.logs_auditoria
    ADD CONSTRAINT logs_auditoria_utilizador_id_fkey FOREIGN KEY (utilizador_id) REFERENCES public.utilizadores(id) ON DELETE SET NULL;


--
-- Name: perfil_permissoes perfil_permissoes_permissao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.perfil_permissoes
    ADD CONSTRAINT perfil_permissoes_permissao_id_fkey FOREIGN KEY (permissao_id) REFERENCES public.permissoes(id) ON DELETE CASCADE;


--
-- Name: sessoes sessoes_utilizador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.sessoes
    ADD CONSTRAINT sessoes_utilizador_id_fkey FOREIGN KEY (utilizador_id) REFERENCES public.utilizadores(id) ON DELETE CASCADE;


--
-- Name: tags tags_plc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_plc_id_fkey FOREIGN KEY (plc_id) REFERENCES public.plcs(id) ON DELETE CASCADE;


--
-- Name: tokens_recuperacao tokens_recuperacao_utilizador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: danilo
--

ALTER TABLE ONLY public.tokens_recuperacao
    ADD CONSTRAINT tokens_recuperacao_utilizador_id_fkey FOREIGN KEY (utilizador_id) REFERENCES public.utilizadores(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

