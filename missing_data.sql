--
-- PostgreSQL database dump
--

\restrict XVeeXmbLrSO3szFQVEFU0kSa0J1dSgFa5ejQZjAZJ5K67tLDMAox7E7sHiGkrmU

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
-- PostgreSQL database dump complete
--

\unrestrict XVeeXmbLrSO3szFQVEFU0kSa0J1dSgFa5ejQZjAZJ5K67tLDMAox7E7sHiGkrmU

