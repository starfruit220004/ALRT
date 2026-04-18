--
-- PostgreSQL database dump
--

\restrict 62tdT1YGZsxrTuYJ4K6bXNRdFUJZmP8CN07GLZgfH5y5ob8rfUoaggmHdtIqMk5

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
-- Data for Name: cms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cms (id, section, key, value, updatedat) FROM stdin;
\.


--
-- Name: cms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cms_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 62tdT1YGZsxrTuYJ4K6bXNRdFUJZmP8CN07GLZgfH5y5ob8rfUoaggmHdtIqMk5

