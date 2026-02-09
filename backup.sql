--
-- PostgreSQL database dump
--

\restrict R5myQSgA2lhIdD5FcoJ88ejX3te61jKtQN4eVh0lB28sUwRzIJwm6XoTTAnYUgb

-- Dumped from database version 17.7 (bdd1736)
-- Dumped by pg_dump version 18.1

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
-- Name: banner_locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.banner_locations (
    banner_id integer NOT NULL,
    location_id integer NOT NULL
);


ALTER TABLE public.banner_locations OWNER TO neondb_owner;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    url text NOT NULL,
    duration integer DEFAULT 10 NOT NULL,
    title character varying(255),
    image_source character varying(50),
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    active boolean DEFAULT true NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone
);


ALTER TABLE public.banners OWNER TO neondb_owner;

--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banners_id_seq OWNER TO neondb_owner;

--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_num character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    person_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.locations OWNER TO neondb_owner;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO neondb_owner;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: persons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.persons (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.persons OWNER TO neondb_owner;

--
-- Name: persons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.persons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.persons_id_seq OWNER TO neondb_owner;

--
-- Name: persons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.persons_id_seq OWNED BY public.persons.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    name character varying(255),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: persons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.persons ALTER COLUMN id SET DEFAULT nextval('public.persons_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: banner_locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.banner_locations (banner_id, location_id) FROM stdin;
15	5
15	3
4	2
4	3
4	5
9	2
13	5
12	5
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.banners (id, type, url, duration, title, image_source, "position", created_at, updated_at, description, active, start_date, end_date) FROM stdin;
15	image	https://www.titikomapost.com/wp-content/uploads/2021/02/IMG-20210209-WA0179.jpg	10	banner selamat datang	url	5	2026-02-02 08:04:10.114011	2026-02-05 01:50:39.429108	banner selamat datang	t	2026-01-31 17:00:00+00	2026-02-16 17:00:00+00
10	image	https://www.tps.co.id/_img/press_release/image/tim_inovasi_tps_(dari_kiri_ke_kanan_ikhsan_efendy,_zefrry_pramastha,_agus_triyono,_aris_setya_yuwana_dan_dodo_kresno)_20260128t091815655z052658.jpg?w=700	10	lomba inovasi sptp 2026	url	1	2026-01-29 01:33:16.877819	2026-02-02 07:27:35.211787	lomba inovasi	f	2026-01-21 00:00:00+00	2026-02-23 17:00:00+00
4	image	https://portal.tps.co.id/images/events/BAMAP.png	5	bamap	url	4	2026-01-26 07:09:46.499821	2026-02-03 02:10:05.30794	\N	t	2026-01-16 00:00:00+00	2026-02-21 00:00:00+00
9	video	https://gss.tps.co.id/Content/Video/A_BantuanInduction.mp4	0	image (gdrive)	\N	2	2026-01-28 07:46:07.105231	2026-02-03 02:09:01.360302	\N	f	2026-01-22 00:00:00+00	2026-01-30 00:00:00+00
12	image	https://peo.pelindo.id/images/flyer/IMG-20260128-WA0016.jpg	3	pelindo forum 2026	url	0	2026-01-29 03:58:01.0322	2026-02-03 07:08:17.233771	poster pelindo forum 2026\n	t	2026-01-22 17:00:00+00	2026-02-15 17:00:00+00
13	image	https://peo.pelindo.id/images/flyer/WhatsApp%20Image%202026-01-27%20at%2017.52.34.jpeg	3	pelindo eduhub	url	3	2026-01-29 03:58:24.924189	2026-02-05 01:50:08.592034	poster pelindo eduhub	t	2026-01-15 00:00:00+00	2026-01-23 17:00:00+00
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, invoice_num, price, person_id, created_at) FROM stdin;
217	TPS/IV/10201	150000.00	144	2026-01-22 01:59:57.013368
218	TPS/IV/10202	1200.00	144	2026-01-22 01:59:57.438161
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.locations (id, name, slug, created_at) FROM stdin;
2	PnC Lt. 2	pnc-lt-2	2026-01-30 07:47:26.355422
3	operation	operation	2026-02-02 07:59:37.363053
4	lobby gedung baru	lobby-gedung-baru	2026-02-02 07:59:59.401106
5	lobby gedung pp	lobby-gedung-pp	2026-02-02 08:00:16.613709
\.


--
-- Data for Name: persons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.persons (id, name, email, created_at) FROM stdin;
144	Rio	rio@tps.co.id	2026-01-22 01:59:56.588111
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, name, active, created_at) FROM stdin;
1	MAGANG	magang	t	2026-02-03 01:10:43.033046
\.


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.banners_id_seq', 17, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 218, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.locations_id_seq', 5, true);


--
-- Name: persons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.persons_id_seq', 144, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: banner_locations banner_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banner_locations
    ADD CONSTRAINT banner_locations_pkey PRIMARY KEY (banner_id, location_id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: locations locations_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_slug_key UNIQUE (slug);


--
-- Name: persons persons_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT persons_email_key UNIQUE (email);


--
-- Name: persons persons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT persons_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_banners_position; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_banners_position ON public.banners USING btree ("position");


--
-- Name: idx_banners_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_banners_type ON public.banners USING btree (type);


--
-- Name: idx_invoice_num; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_invoice_num ON public.invoices USING btree (invoice_num);


--
-- Name: idx_invoices_person_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_invoices_person_id ON public.invoices USING btree (person_id);


--
-- Name: banner_locations banner_locations_banner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banner_locations
    ADD CONSTRAINT banner_locations_banner_id_fkey FOREIGN KEY (banner_id) REFERENCES public.banners(id) ON DELETE CASCADE;


--
-- Name: banner_locations banner_locations_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banner_locations
    ADD CONSTRAINT banner_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict R5myQSgA2lhIdD5FcoJ88ejX3te61jKtQN4eVh0lB28sUwRzIJwm6XoTTAnYUgb

