--
-- PostgreSQL database dump
--

\restrict KApsESg1dt1S0MrkD2Rufj6LGrzMCwrR20CF7IFdqkdO0YZ231V7obyB4xaa6El

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    message text,
    sensor_data json,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: cms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms (
    id integer NOT NULL,
    section character varying(50) NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    updatedat timestamp(6) with time zone NOT NULL
);


--
-- Name: cms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cms_id_seq OWNED BY public.cms.id;


--
-- Name: door_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.door_logs (
    id integer NOT NULL,
    status character varying(10),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer
);


--
-- Name: door_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.door_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: door_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.door_logs_id_seq OWNED BY public.door_logs.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    alarm_enabled boolean DEFAULT false,
    sms_enabled boolean DEFAULT true,
    user_id integer,
    schedule_start character varying(5) DEFAULT '08:00'::character varying,
    schedule_end character varying(5) DEFAULT '17:00'::character varying
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_logs (
    id integer NOT NULL,
    status character varying(50) NOT NULL,
    user_id integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sms_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_logs_id_seq OWNED BY public.sms_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text,
    email text,
    password text,
    role character varying(20) DEFAULT 'user'::character varying,
    reset_token text,
    avatar text,
    mqtt_topic character varying(255),
    phone character varying(15),
    username character varying(50),
    first_name character varying(100),
    last_name character varying(100),
    middle_name character varying(100),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    deactivated_at timestamp(6) with time zone,
    is_verified boolean DEFAULT false NOT NULL,
    verify_token text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: cms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms ALTER COLUMN id SET DEFAULT nextval('public.cms_id_seq'::regclass);


--
-- Name: door_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_logs ALTER COLUMN id SET DEFAULT nextval('public.door_logs_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: sms_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_logs ALTER COLUMN id SET DEFAULT nextval('public.sms_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alerts (id, message, sensor_data, created_at) FROM stdin;
\.


--
-- Data for Name: cms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms (id, section, key, value, updatedat) FROM stdin;
\.


--
-- Data for Name: door_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.door_logs (id, status, created_at, user_id) FROM stdin;
6	CLOSE	2026-04-10 04:39:04.602	1
7	CLOSE	2026-04-10 04:44:40.565	1
8	OPEN	2026-04-10 04:45:30.165	1
9	Alarm	2026-04-10 04:45:30.209	1
10	CLOSE	2026-04-10 04:45:51.859	1
11	CLOSE	2026-04-12 09:40:21.215	1
12	CLOSE	2026-04-12 10:03:52.771	1
13	CLOSE	2026-04-12 10:36:41.347	1
14	CLOSE	2026-04-12 10:41:16.38	1
15	OPEN	2026-04-12 10:41:31.606	1
16	Alarm	2026-04-12 10:41:31.615	1
17	CLOSE	2026-04-12 10:41:44.72	1
18	OPEN	2026-04-12 10:41:55.908	1
19	Alarm	2026-04-12 10:41:55.916	1
20	CLOSE	2026-04-12 10:42:00.861	1
21	OPEN	2026-04-12 10:47:49.456	1
22	Alarm	2026-04-12 10:47:49.466	1
23	CLOSE	2026-04-12 10:47:51.496	1
24	CLOSE	2026-04-12 10:48:58.924	1
25	CLOSE	2026-04-16 23:59:12.769	1
26	CLOSE	2026-04-17 00:39:40.992	1
27	CLOSE	2026-04-17 06:02:35.442	1
28	OPEN	2026-04-17 06:45:21.27	1
29	Alarm	2026-04-17 06:45:21.29	1
30	CLOSE	2026-04-17 06:45:31.489	1
31	OPEN	2026-04-17 07:04:23.241	1
32	Alarm	2026-04-17 07:04:23.269	1
33	CLOSE	2026-04-17 07:04:25.156	1
34	CLOSE	2026-04-17 07:04:25.156	1
35	OPEN	2026-04-17 07:04:25.156	1
36	Alarm	2026-04-17 07:04:25.171	1
37	OPEN	2026-04-17 07:07:55.027	1
38	Alarm	2026-04-17 07:07:55.036	1
39	CLOSE	2026-04-17 07:08:01.977	1
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, alarm_enabled, sms_enabled, user_id, schedule_start, schedule_end) FROM stdin;
2	f	f	2	08:00	17:00
1	t	t	1	08:00	17:00
4	f	t	3	08:00	17:00
\.


--
-- Data for Name: sms_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sms_logs (id, status, user_id, created_at) FROM stdin;
1	OPEN	1	2026-04-10 04:45:30.199
2	Alarm	1	2026-04-10 04:45:30.213
3	OPEN	1	2026-04-12 10:41:31.612
4	Alarm	1	2026-04-12 10:41:31.616
5	OPEN	1	2026-04-12 10:41:55.914
6	Alarm	1	2026-04-12 10:41:55.918
7	OPEN	1	2026-04-12 10:47:49.464
8	Alarm	1	2026-04-12 10:47:49.468
9	OPEN	1	2026-04-17 06:45:21.283
10	Alarm	1	2026-04-17 06:45:21.292
11	OPEN	1	2026-04-17 07:04:23.261
12	Alarm	1	2026-04-17 07:04:23.274
13	OPEN	1	2026-04-17 07:04:25.168
14	Alarm	1	2026-04-17 07:04:25.173
15	OPEN	1	2026-04-17 07:07:55.034
16	Alarm	1	2026-04-17 07:07:55.038
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, reset_token, avatar, mqtt_topic, phone, username, first_name, last_name, middle_name, address, is_active, deactivated_at, is_verified, verify_token) FROM stdin;
2	star fruit	sfruit325@gmail.com	$2b$10$zcDwTETAEaqmXnVNfacVcOfV3B7bsQjimsIB9WKR5dPHSbfYx4BKa	user	\N	\N	Smart_Alert/user_2/door	+639555946305	starfruit	star	fruit	\N	Baliwasan, Zamboanga City	t	\N	f	fae8db1487a613fafae0f03dfe4c6f97d6aabc3ace5fb91fac7fbb1b751fcbaf
3	Hannah Jean Balimbingan	balimbinganhannahjean@gmail.com	$2b$10$4spwX7ND8JB1vKjkOqf2V.D/MZeTuGoDAb0df4mMk8WwA.YvaySbi	admin	\N	\N	Smart_Alert/user_3/door	\N	admin	Hannah Jean	Balimbingan	\N	\N	t	\N	t	\N
1	Hannah Balimbingan	hannahjeanbalimbingan@gmail.com	$2b$10$Zk3j/II477l7m2nE8COptuLFxuSSmiTpogFHMNYPfqQd3mKzC5P7m	user	\N	\N	Smart_Alert/user_1/door	+639555946305	Hannah	Hannah	Balimbingan	Tabay	Baliwasan, Zamboanga City	t	\N	t	\N
\.


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alerts_id_seq', 1, false);


--
-- Name: cms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cms_id_seq', 1, false);


--
-- Name: door_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.door_logs_id_seq', 39, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 4, true);


--
-- Name: sms_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sms_logs_id_seq', 16, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: cms cms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms
    ADD CONSTRAINT cms_pkey PRIMARY KEY (id);


--
-- Name: door_logs door_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_logs
    ADD CONSTRAINT door_logs_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cms_section_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cms_section_key_key ON public.cms USING btree (section, key);


--
-- Name: settings_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX settings_user_id_key ON public.settings USING btree (user_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: door_logs door_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.door_logs
    ADD CONSTRAINT door_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: settings settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sms_logs sms_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KApsESg1dt1S0MrkD2Rufj6LGrzMCwrR20CF7IFdqkdO0YZ231V7obyB4xaa6El

