--
-- PostgreSQL database dump
--

\restrict htjm4LESZOCx2hVFvMirBjnxEy0SUJUc1X6njtsPFAxgmTK4BsSuUyLv8NsdSMZ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    item_name character varying(255) NOT NULL,
    description text,
    job_rate numeric DEFAULT 0,
    weight_type1 numeric DEFAULT 0,
    weight_type2 numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: jobber_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobber_adjustments (
    id integer NOT NULL,
    jobber_id integer,
    amount numeric NOT NULL,
    date date NOT NULL,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.jobber_adjustments OWNER TO postgres;

--
-- Name: jobber_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobber_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobber_adjustments_id_seq OWNER TO postgres;

--
-- Name: jobber_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobber_adjustments_id_seq OWNED BY public.jobber_adjustments.id;


--
-- Name: jobbers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobbers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    opening_stock_type1 numeric DEFAULT 0,
    opening_stock_type2 numeric DEFAULT 0,
    opening_amount numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.jobbers OWNER TO postgres;

--
-- Name: jobbers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobbers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobbers_id_seq OWNER TO postgres;

--
-- Name: jobbers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobbers_id_seq OWNED BY public.jobbers.id;


--
-- Name: material_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.material_transfers (
    id integer NOT NULL,
    from_jobber_id integer,
    to_jobber_id integer,
    type1 numeric DEFAULT 0,
    type2 numeric DEFAULT 0,
    material character varying(255) NOT NULL,
    date date NOT NULL,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_different_jobbers CHECK ((from_jobber_id <> to_jobber_id))
);


ALTER TABLE public.material_transfers OWNER TO postgres;

--
-- Name: material_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.material_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.material_transfers_id_seq OWNER TO postgres;

--
-- Name: material_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.material_transfers_id_seq OWNED BY public.material_transfers.id;


--
-- Name: seller_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seller_adjustments (
    id integer NOT NULL,
    seller_id integer,
    amount numeric NOT NULL,
    date date NOT NULL,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.seller_adjustments OWNER TO postgres;

--
-- Name: seller_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seller_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seller_adjustments_id_seq OWNER TO postgres;

--
-- Name: seller_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seller_adjustments_id_seq OWNED BY public.seller_adjustments.id;


--
-- Name: sellers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sellers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sellers OWNER TO postgres;

--
-- Name: sellers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sellers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sellers_id_seq OWNER TO postgres;

--
-- Name: sellers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sellers_id_seq OWNED BY public.sellers.id;


--
-- Name: transactions_in; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions_in (
    id integer NOT NULL,
    jobber_id integer,
    seller_id integer,
    type1 numeric DEFAULT 0,
    type2 numeric DEFAULT 0,
    material character varying(255),
    rate numeric DEFAULT 0,
    amount numeric DEFAULT 0,
    date date NOT NULL,
    remark text,
    w boolean DEFAULT false,
    b boolean DEFAULT false,
    a boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transactions_in OWNER TO postgres;

--
-- Name: transactions_in_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_in_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_in_id_seq OWNER TO postgres;

--
-- Name: transactions_in_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_in_id_seq OWNED BY public.transactions_in.id;


--
-- Name: transactions_out; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions_out (
    id integer NOT NULL,
    jobber_id integer,
    vendor_id integer,
    type1 numeric DEFAULT 0,
    type2 numeric DEFAULT 0,
    material character varying(255),
    rate numeric DEFAULT 0,
    amount numeric DEFAULT 0,
    date date NOT NULL,
    remark text,
    w boolean DEFAULT false,
    b boolean DEFAULT false,
    a boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transactions_out OWNER TO postgres;

--
-- Name: transactions_out_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_out_id_seq OWNER TO postgres;

--
-- Name: transactions_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_out_id_seq OWNED BY public.transactions_out.id;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Name: vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendors_id_seq OWNER TO postgres;

--
-- Name: vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendors_id_seq OWNED BY public.vendors.id;


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: jobber_adjustments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobber_adjustments ALTER COLUMN id SET DEFAULT nextval('public.jobber_adjustments_id_seq'::regclass);


--
-- Name: jobbers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobbers ALTER COLUMN id SET DEFAULT nextval('public.jobbers_id_seq'::regclass);


--
-- Name: material_transfers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_transfers ALTER COLUMN id SET DEFAULT nextval('public.material_transfers_id_seq'::regclass);


--
-- Name: seller_adjustments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_adjustments ALTER COLUMN id SET DEFAULT nextval('public.seller_adjustments_id_seq'::regclass);


--
-- Name: sellers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers ALTER COLUMN id SET DEFAULT nextval('public.sellers_id_seq'::regclass);


--
-- Name: transactions_in id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_in ALTER COLUMN id SET DEFAULT nextval('public.transactions_in_id_seq'::regclass);


--
-- Name: transactions_out id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_out ALTER COLUMN id SET DEFAULT nextval('public.transactions_out_id_seq'::regclass);


--
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.vendors_id_seq'::regclass);


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, item_name, description, job_rate, weight_type1, weight_type2, created_at, updated_at) FROM stdin;
1	73 Mm Star Cap		55	1	0	2026-05-26 20:04:57.975	2026-06-03 19:08:16.564
2	Small Spoon		68	1	1	2026-05-26 20:08:51.342	2026-05-26 20:08:51.342
3	Big Spoon		31	1	1	2026-05-26 20:13:18.312	2026-05-26 20:13:18.312
4	10kg Cap		1.4	0.058	0	2026-05-26 20:16:56.809	2026-06-03 19:07:13.661
5	Orange Jug ( Printed )		3.2	0.108	0.108	2026-05-26 20:23:43.457	2026-05-26 20:23:43.457
6	53 Mm Cap		33	1	0	2026-05-26 20:50:11.219	2026-06-03 19:07:28.139
7	96 Mm ( P )		20	1	1	2026-05-26 20:53:02.083	2026-05-26 20:53:02.083
8	96 Mm Star Cap		22	1	1	2026-05-26 20:56:08.618	2026-05-26 20:56:08.618
9	7 Kg Cap		0.95	0.051	0	2026-05-26 21:00:00.856	2026-06-07 20:48:19.965
10	73 Mm Cap ( Printed )		27.6	1	0	2026-05-26 22:01:16.796	2026-06-03 19:08:05.926
11	Likar Cap		35	1	1	2026-05-26 22:03:06.749	2026-05-26 22:03:06.749
12	53 Mm First		33	1	0	2026-05-27 17:18:53.752	2026-06-03 19:07:47.024
13	83 Mm First		21	1	1	2026-05-27 17:20:26.984	2026-05-27 17:20:26.984
14	120 Mm Cap		32	1	0	2026-05-27 17:22:19.84	2026-06-03 19:07:19.251
15	73 Mm Ivory		27.6	1	0	2026-05-27 17:23:26.925	2026-06-03 19:08:10.165
16	96 Mm Ivory		20	1	1	2026-05-27 17:25:59.443	2026-05-27 17:25:59.443
17	60 Mm Cap		60	1	0	2026-05-27 18:46:27.767	2026-06-03 22:06:55.069
18	96 Mm Big Cap		0.55	0.03	0	2026-05-27 18:59:43.646	2026-05-27 19:54:50.804
19	73 Mm Big Cap		0.55	0.022	0	2026-05-27 19:09:25.687	2026-06-07 17:28:13.786
20	Rajwadi 8 Kg Cap		1.25	0.05	0.05	2026-05-27 19:47:52.931	2026-05-27 19:48:17.94
21	Rajwadi 5 Kg Cap		1.25	0.0345	0.0345	2026-05-27 19:49:33.455	2026-05-27 19:49:33.455
22	Rajwadi Lock		80	1	1	2026-05-27 19:52:31.458	2026-05-27 19:52:31.458
23	Timtom 44 (doz)	Ready In Doz	17.3	0.48	0	2026-06-02 19:25:11.2	2026-06-03 19:06:53.945
24	Medium Kunda Plate (doz)	Ready	16.7	0	0.828	2026-06-02 19:30:58.881	2026-06-03 19:06:18.482
25	Bulbul Dana Plate With Hanger (doz)	Ready	34.4	0	1.248	2026-06-02 20:01:59.013	2026-06-03 19:06:02.735
26	Pigeon Bowl With Hanger (doz	Ready	32.9	0	1.452	2026-06-02 20:03:56.55	2026-06-03 19:06:39.029
27	Strawberry Jug (doz)	Ready	35.16	1.032	0	2026-06-02 20:05:29.786	2026-06-03 19:06:49.214
28	Orange Jug First (doz)	Ready	38.4	1.296	0	2026-06-02 20:07:05.04	2026-06-03 19:06:26.463
29	Orange Jug Natural (doz)	Ready	38.4	1.296	0	2026-06-02 20:08:32.395	2026-06-03 19:06:31.127
30	Store King 1000 With Spoon (doz)	Ready	17.4	0.432	0	2026-06-02 20:10:41.416	2026-06-02 20:10:41.416
31	Clean India Kharata (pcs)	Ready	7.75	0.116	0	2026-06-02 20:20:57.892	2026-06-03 19:06:09.303
32	Chiku Basket (doz)	Ready	24	0.72	0	2026-06-02 20:23:15.818	2026-06-02 20:23:15.818
33	Kalash No.3 Loose (doz)	Ready	14.62	0.456	0	2026-06-02 20:24:44.496	2026-06-02 20:24:44.496
34	Store King 2000 With Spoon (doz)	Ready	21	0.72	0	2026-06-02 20:25:44.359	2026-06-02 20:25:44.359
35	Mr. Clean Supdi First (doz)	Ready	21	0.648	0	2026-06-02 20:27:01.758	2026-06-02 20:27:01.758
36	Khitti (doz)	Ready	17	0.3	0	2026-06-02 20:28:03.454	2026-06-02 20:28:03.454
37	Store King 3000 With Spoon (doz)	Ready	31	1.056	0	2026-06-02 20:29:00.003	2026-06-02 20:29:00.003
38	Lock & Seal 700 With Dabi (doz)	Ready	78	1.572	0	2026-06-02 20:31:56.598	2026-06-02 20:31:56.598
39	Big Modak Container (doz)	Ready	30	0.756	0	2026-06-02 20:34:03.111	2026-06-07 20:48:42.854
40	Medium Papad Printed (doz)	Ready	29.5	1.5	0	2026-06-02 20:36:19.57	2026-06-02 20:36:19.57
41	Medium Papad First (doz)	Ready	29.5	1.368	0	2026-06-02 20:37:41.392	2026-06-02 20:37:41.392
42	Lunch Time Lunch Box (doz)	Ready	66	1.152	0	2026-06-02 20:39:06.224	2026-06-02 20:39:06.224
43	Stunner Double Mold (doz)	Ready	26.4	0.756	0	2026-06-02 20:42:04.09	2026-06-03 22:06:42.735
44	Tomato Basket(doz)	Ready	26.4	0.695	0	2026-06-02 20:42:57.79	2026-06-03 22:07:16.227
45	6'kunda (doz)	Ready	16.8	0	0.684	2026-06-02 20:45:40.387	2026-06-02 20:50:25.164
46	Char Minar Cutlary (doz)	Ready	26.4	0.792	0	2026-06-02 20:47:10.232	2026-06-02 20:47:10.232
47	8' Kunda Wooden (doz)	Ready	25	0	1.236	2026-06-02 20:49:05.763	2026-06-03 19:05:00.491
48	Timtom 55 (doz)	Ready	22	0.705	0	2026-06-02 20:51:38.285	2026-06-03 19:05:35.365
49	8' Tulsi Kunda Wooden (doz)	Ready	25	0	1.32	2026-06-02 20:52:55.931	2026-06-03 19:05:04.553
50	Flower Basket Dlx (doz)	Ready	42	0	1.9	2026-06-02 20:54:57.528	2026-06-03 19:04:52.78
51	3 Ltr. Bucket With Cap (doz)	Ready	52	0	1.8	2026-06-02 20:56:50.599	2026-06-03 19:05:28.138
52	Matka Stand Dlx (doz)	Ready	42	0	1.68	2026-06-02 20:58:04.982	2026-06-03 19:05:16.219
53	Kitchen Basket Dlx (doz)	Ready	28.8	1.133	0	2026-06-02 21:00:08.323	2026-06-02 21:00:08.323
54	Anupama Basket Dlx (doz)	Ready	28.8	1.104	0	2026-06-02 21:01:05.15	2026-06-02 21:01:05.15
55	Timtom 66 (doz)	Ready	31.2	1.002	0	2026-06-02 21:02:06.005	2026-06-02 21:02:06.005
56	Seltos Mug (doz)	Ready	14.4	0.69	0	2026-06-02 21:04:39.579	2026-06-02 21:04:39.579
57	Small Hungry Lunch Box (doz)	Ready	30	0.65	0	2026-06-02 21:05:39.446	2026-06-02 21:05:39.446
58	Double Door Pencil Box (doz)	Ready	28	0.57	0	2026-06-02 21:06:32.605	2026-06-02 21:06:32.605
59	1600 Dabi (doz)	Ready	12	0.26	0	2026-06-02 21:07:38.507	2026-06-02 21:07:38.507
60	14' Kunda Wooden (doz)	Ready	77.4	0	4.92	2026-06-02 21:09:31.674	2026-06-02 21:11:23.876
61	16' Kunda Wooden (doz)	Ready	126	0	7.8	2026-06-02 21:13:45.134	2026-06-02 21:13:45.134
62	Balcony Kunda Big (doz)	Ready	120	0	6.24	2026-06-02 21:14:59.633	2026-06-02 21:14:59.633
63	20' Kunda (doz)	Ready	156	0	10.32	2026-06-02 21:17:33.659	2026-06-02 21:17:33.659
64	Store King 15000 (doz)	Ready	112.8	4.2	0	2026-06-02 21:20:23.889	2026-06-02 21:20:23.889
65	10' Kunda Wooden (doz)	Ready	42	0	2.184	2026-06-02 21:23:16.342	2026-06-08 00:43:56.834
66	12' Kunda Wooden (doz)	Ready	72	0	3.756	2026-06-02 22:19:44.221	2026-06-08 00:42:30.02
67	Store King 5000 (doz)	Ready	45.6	1.572	0	2026-06-02 22:22:14.297	2026-06-02 22:22:14.297
68	Rajwadi 5000 (doz)	Ready	54	1.56	0	2026-06-02 22:23:54.114	2026-06-02 22:23:54.114
69	Store King 7000 (doz)	Ready	60	2.244	0	2026-06-02 22:25:30.732	2026-06-02 22:25:30.732
70	Pan Tray 3 Dlx (doz)	Ready	64.8	0	3.3	2026-06-02 22:27:26.829	2026-06-08 00:39:51.662
71	Store King 10000 (doz)	Ready	76.8	3.012	0	2026-06-02 22:29:09.821	2026-06-02 22:29:09.821
72	Rajwadi 8000 (doz)	Ready	63.6	2.184	0	2026-06-02 22:34:27.692	2026-06-08 00:37:39.942
73	Pan Tray 4 Dlx (doz)	Ready	84	0	5.376	2026-06-02 22:35:51.561	2026-06-08 00:34:59.121
74	Small Bite Lunch Box(doz)	Ready	36	0.642	0	2026-06-02 22:38:27.638	2026-06-02 22:38:27.638
75	15 Kg Cap		1.9	0.09	0	2026-06-03 18:41:10.21	2026-06-03 18:41:10.21
76	Pan Tray 1 Dlx (doz)	Ready	16	0	0.933	2026-06-05 16:48:27.505	2026-06-05 16:48:27.505
\.


--
-- Data for Name: jobber_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobber_adjustments (id, jobber_id, amount, date, remark, created_at) FROM stdin;
2	8	50000	2026-05-15	Bank - Nimuch	2026-05-27 20:59:43.194
3	10	53000	2026-05-29	Cheque 29/5 Zashi 53000	2026-06-02 17:25:52.676
4	8	45000	2026-05-30	Bank 30/5 95 Thaya Jabalpur	2026-06-02 19:12:42.929
5	8	21800	2026-06-02	Bank Abc 3/6 116800 Thaya	2026-06-02 19:16:03.58
6	8	74300	2026-06-03	Bank 3/6 Neem Ka Thana 191100 Thaya	2026-06-02 19:17:33.416
7	1	-300	2026-05-31	Tempo Bhada	2026-06-03 18:57:39.114
8	1	141066	2026-06-04	141060 Cash 31/5 All Clear	2026-06-03 19:04:11.899
9	10	-1770	2026-05-31	Bori	2026-06-03 22:11:56.182
10	10	17592	2026-06-04	17600 Cash 31/5 All Clear	2026-06-03 22:19:28.768
11	14	8784	2026-06-05	Cash 8780 5/6 Clear Till 31/5	2026-06-05 16:54:23.309
12	11	-720	2026-05-31	Theli Difference	2026-06-07 17:37:49.84
13	11	59451	2026-06-08	Cash 59450 Clear Till 31/5 	2026-06-07 17:47:02.242
14	3	250000	2026-06-08	Cash 8/6 250000	2026-06-07 18:02:39.25
15	4	-9049	2026-05-30	5% Plus On Job	2026-06-07 21:03:02.022
16	4	-800	2026-05-31	Grinding	2026-06-07 21:03:29.119
17	4	-1193	2026-05-31	Parchuran	2026-06-07 21:03:46.195
18	4	192027	2026-06-06	192000 Cash Clear Till 31/5	2026-06-07 21:04:59.943
19	9	65136	2026-06-08	65140 Cash Clear Till 31/5	2026-06-07 21:09:22.079
20	8	15000	2026-06-06	Bank 15000  Neemuch 7/6	2026-06-08 00:46:18.349
21	8	137472	2026-06-08	Cash 137470 Clear Till 31/5 	2026-06-08 00:50:24.101
22	2	53882	2026-05-31	Old 	2026-06-12 20:44:09.674
23	19	58830	2026-06-13	Cash 58830 All Clear Till 31/5	2026-06-12 21:01:17.869
\.


--
-- Data for Name: jobbers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobbers (id, name, opening_stock_type1, opening_stock_type2, opening_amount, created_at) FROM stdin;
1	Nilesh	1054	2650	0	2026-05-21 22:57:21.316
2	Kalu	2103.57	0	-74050	2026-05-21 22:58:22.069
3	Babu	8437	712	-100000	2026-05-21 22:58:46.656
4	Rasik	5658	0	0	2026-05-21 22:59:12.229
5	Raju	0	0	0	2026-05-21 23:02:41.36
6	Fhp	0	0	0	2026-05-21 23:08:48.716
7	Anil Shubh	-103	2594	0	2026-05-25 21:16:25.398
8	Lala	805	1147.3	0	2026-05-25 21:20:43.037
9	Jyoti	497.3	532.9	0	2026-05-25 21:24:50.815
10	Pravin	1283.8	0	0	2026-05-25 21:33:46.521
11	Gaurang	4702.66	455.28	0	2026-05-25 21:35:32.507
12	Dhara	0	0	0	2026-05-25 21:40:30.822
13	Umiya	2000	0	0	2026-05-25 21:47:10.582
14	Sarjan Plastic	386.36	717.37	0	2026-05-27 19:14:26.14
15	Old Stock	0	0	0	2026-05-27 19:43:05.337
17	Blow Himanshu	247.6	0	0	2026-05-27 21:00:30.317
18	Blow Shailesh	26.75	0	0	2026-05-27 21:01:20.353
19	Anirudh	1056	43	0	2026-05-27 21:02:22.002
20	Rahul	302	0	0	2026-05-27 21:03:23.028
21	Naresh ( 350 )	13	0	0	2026-05-27 21:04:01.119
22	Sandip ( Vanch )	108	0	0	2026-05-27 21:04:55.602
23	Shakti ( 7/361 )	670.68	0	0	2026-05-27 21:05:49.559
24	Vipul Sriram - 54	61.36	0	0	2026-05-27 21:07:31.361
26	Shivam	0	0	0	2026-05-28 17:09:44.21
\.


--
-- Data for Name: material_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.material_transfers (id, from_jobber_id, to_jobber_id, type1, type2, material, date, remark, created_at) FROM stdin;
1	4	11	250	0	Natural	2026-05-19		2026-05-26 20:58:11.736
2	6	3	250	0	Random	2026-05-23		2026-05-27 18:38:58.211
3	2	10	250	0	Virgin	2026-05-04		2026-05-27 18:44:29.153
4	6	10	296.8	0	Natural	2026-05-04		2026-05-27 18:45:34.94
5	6	1	250	0	Random	2026-05-04		2026-05-27 18:53:05.659
6	6	11	10	0	Black Masterbatch	2026-05-26		2026-05-27 18:56:47.704
7	6	11	5	0	Master ( G + P )	2026-05-24		2026-05-27 18:57:27.899
8	15	2	200	0	First Colour	2026-04-09	From Gaurang	2026-05-27 19:43:31.73
9	2	15	125	0	Virgin Random	2026-04-06	To Pravin	2026-05-27 19:45:47.876
10	2	15	75	0	Virgin	2026-04-23	To Rasik	2026-05-27 19:46:45.535
13	13	15	155.56	0	Virgin Mix Random 	2026-04-15	To Babu	2026-05-27 20:49:36.148
14	13	15	400	0	Virgin Mix Random	2026-04-15	To Babu	2026-05-27 20:50:16.979
15	6	8	750	0	Random	2026-05-18		2026-05-27 20:56:06.969
16	6	23	2	0	Master	2026-02-28	Old Stock	2026-05-27 21:06:53.678
17	6	11	0	0	125 - Khali Box	2026-05-23		2026-05-28 17:05:19.119
18	2	10	500	0	Nyra	2026-05-27	Return	2026-06-02 17:24:54.983
19	10	2	100	0	Milky	2026-05-27	Return	2026-06-02 18:59:46.101
20	6	11	5	0	Master ( G + P )	2026-05-29		2026-06-02 19:03:18.002
21	9	15	40	0	Material	2026-05-31	Material Difference Old	2026-06-07 21:08:02.033
\.


--
-- Data for Name: seller_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seller_adjustments (id, seller_id, amount, date, remark, created_at) FROM stdin;
1	1	746350	2026-05-05	Ambica 5/5	2026-05-21 23:01:38.607
2	6	258100	2026-05-09	Cash 9/5 	2026-05-21 23:06:18.783
3	6	41	2026-05-08	Round Off Clear 9/5	2026-05-21 23:07:29.063
4	7	78110	2026-05-07	Hemant Plast 7/5 	2026-05-21 23:23:02.726
5	13	931430	2026-05-15	All Clear Till 15/5 \n931430 Cash 	2026-05-25 21:26:23.525
6	13	13	2026-05-15	Round Off	2026-05-25 21:26:39.885
7	7	1	2026-05-07	Round Off	2026-05-25 21:28:07.439
8	15	99650	2026-05-17	Cash	2026-05-25 21:30:31.991
9	16	248400	2026-05-19	Cash	2026-05-25 21:34:33.761
10	17	63250	2026-05-20	Cash	2026-05-25 21:36:41.887
11	18	94800	2026-05-20	Credit Note (march App + Gtd + Annual)	2026-05-25 21:38:42.034
12	18	220567	2026-05-20	Bank	2026-05-25 21:39:15.379
13	1	716496	2026-05-20	Ambica 20/5	2026-05-25 21:41:19.204
14	19	106000	2026-05-20	Cash 	2026-05-25 21:43:34.656
15	20	54280	2026-05-21	Cash	2026-05-25 21:45:54.084
16	21	1000000	2026-05-22	Nyra 22/5	2026-05-25 21:56:58.818
17	21	966764	2026-05-23	Nyra 23/5	2026-05-25 22:01:07.326
18	24	130000	2026-05-21	Cash	2026-05-25 22:03:19.411
19	1	358248	2026-05-27	Ambica 27/5	2026-05-28 17:22:27.566
20	1	602999	2026-05-26	Cash 28/5\n1 Rupee Round Off	2026-05-28 17:23:11.988
21	16	275300	2026-06-01	Cash 1/6	2026-06-02 17:07:59.577
22	13	1044400	2026-05-31	Cash 31/5	2026-06-02 17:14:17.116
24	15	54500	2026-06-03	Adjustment	2026-06-03 18:28:38.606
25	30	211220	2026-06-04	Bank Manoj Plast 4/6	2026-06-05 17:16:24.356
26	30	65600	2026-06-04	Cash Pm Angadiya 4/6 	2026-06-05 17:17:06.142
27	21	804583	2026-06-08	804584 Bank Nyra 8/6 All Clear	2026-06-08 18:40:44.63
28	40	9450	2026-06-08	Cash Clear Till 8/6	2026-06-12 21:04:37.867
29	21	4375	2026-06-12	Credit Note May Qd	2026-06-12 21:18:02.151
30	21	729049	2026-06-11	Bank 729050 13/6 Nyra \n5200 Ronak Girdhar	2026-06-12 21:18:10.555
31	21	0	2026-06-18	Adjustment	2026-06-17 17:01:43.484
\.


--
-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sellers (id, name, created_at) FROM stdin;
1	Sun Plast	2026-05-21 21:20:19.489
6	Ambica	2026-05-21 23:02:35.415
7	Nishant	2026-05-21 23:08:43.393
13	Ajay	2026-05-25 21:16:14.356
15	Sanjay	2026-05-25 21:29:28.629
16	Keshav	2026-05-25 21:31:21.771
17	Kanjibhai	2026-05-25 21:35:23.373
18	Gujarat	2026-05-25 21:37:12.684
19	Anil	2026-05-25 21:41:58.688
20	Lala Grinding	2026-05-25 21:44:42.273
21	Nyra	2026-05-25 21:46:22.543
24	Lalabhai Job	2026-05-25 22:02:51.786
25	Fhp	2026-05-25 22:49:44.644
30	Manoj Plast	2026-05-28 17:10:53.368
32	Swastik	2026-06-02 17:03:38.315
33	Nakoda	2026-06-03 18:44:13.409
38	Pending Entry	2026-06-07 20:55:37.531
39	Old Stock	2026-06-12 20:26:58.078
40	Anirudh	2026-06-12 21:02:18.322
\.


--
-- Data for Name: transactions_in; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions_in (id, jobber_id, seller_id, type1, type2, material, rate, amount, date, remark, w, b, a, created_at) FROM stdin;
1	1	1	1000	0	Nyra	126.5	149270	2026-05-01		t	t	f	2026-05-21 22:57:41.02
2	2	1	1000	0	Nyra	126.5	149270	2026-05-02		t	t	f	2026-05-21 22:58:29.183
3	3	1	1000	0	Nyra	126.5	149270	2026-05-02		t	t	f	2026-05-21 22:58:51.65
4	4	1	2000	0	Nyra	126.5	298540	2026-05-02		t	t	f	2026-05-21 22:59:16.729
5	5	6	570.92	0	53*14	178	101624	2026-05-01		t	f	f	2026-05-21 23:02:51.946
6	5	6	565.94	0	53*14	178	100737	2026-05-04		t	f	f	2026-05-21 23:04:26.938
7	5	6	313.37	0	53*14	178	55780	2026-05-05		t	f	f	2026-05-21 23:05:24.074
8	6	7	50400	0	53*9	1.305	78111	2026-05-06	500 Transport Charges Included In Rate	t	t	f	2026-05-21 23:22:28.111
9	7	13	0	1500	Red	65	97500	2026-05-02		t	f	f	2026-05-25 21:16:31.348
10	1	13	0	1000	Red	65	65000	2026-05-04		t	f	f	2026-05-25 21:17:23.338
11	3	13	0	500	Red	65	32500	2026-05-04		t	f	f	2026-05-25 21:17:55.228
12	3	13	0	500	Red	65	32500	2026-05-05		t	f	f	2026-05-25 21:18:30.35
13	7	13	0	1312.2	Red	65	85293	2026-05-06		t	f	f	2026-05-25 21:19:21.967
14	7	13	0	1500	Red	65	97500	2026-05-08		t	f	f	2026-05-25 21:19:45.413
15	3	13	0	1000	Red	65	65000	2026-05-11		t	f	f	2026-05-25 21:20:19.678
16	8	13	0	1000	Red	65	65000	2026-05-11	89	t	f	f	2026-05-25 21:20:58.515
17	8	13	0	1000	Red	65	65000	2026-05-11	89	t	f	f	2026-05-25 21:21:25.945
18	8	13	0	2000	Red	65	130000	2026-05-12	13	t	f	f	2026-05-25 21:22:18.637
19	8	13	0	1000	Red	65	65000	2026-05-13	13	t	f	f	2026-05-25 21:22:48.519
20	1	13	0	1050	Semi	63	66150	2026-05-13		t	f	f	2026-05-25 21:24:20.67
21	9	13	0	1000	Red	65	65000	2026-05-15		t	f	f	2026-05-25 21:25:22.59
22	4	15	500	0	Natural	108	54000	2026-05-06		t	f	f	2026-05-25 21:29:46.724
23	4	15	550	0	Ivory	83	45650	2026-05-06		t	f	f	2026-05-25 21:30:15.628
24	4	16	500	0	First Colour	92	46000	2026-05-04		t	f	f	2026-05-25 21:31:34.589
25	3	16	500	0	First Colour	92	46000	2026-05-04		t	f	f	2026-05-25 21:32:09.257
26	4	16	250	0	First Colour	92	23000	2026-05-13		t	f	f	2026-05-25 21:32:37.074
27	4	16	100	0	First Colour	92	9200	2026-05-16		t	f	f	2026-05-25 21:33:17.459
28	10	16	900	0	First Colour	92	82800	2026-05-16		t	f	f	2026-05-25 21:33:46.643
29	9	16	450	0	First Colour	92	41400	2026-05-19		t	f	f	2026-05-25 21:34:11.169
30	11	17	25	0	Natural	115	2875	2026-05-04		t	f	f	2026-05-25 21:35:44.811
31	11	17	525	0	Natural	115	60375	2026-05-04		t	f	f	2026-05-25 21:36:16.258
32	8	18	2000	0	Mas	133.63	315367	2026-05-18	13	t	t	f	2026-05-25 21:37:36.962
33	12	1	4800	0	80 - V Flex	126.5	716496	2026-05-19		t	t	f	2026-05-25 21:40:31.001
34	4	19	350	0	Ivory	85	29750	2026-05-06		t	f	f	2026-05-25 21:42:14.967
35	4	19	250	0	Natural	85	21250	2026-05-06		t	f	f	2026-05-25 21:42:39.676
36	4	19	500	0	Natural	110	55000	2026-05-16		t	f	f	2026-05-25 21:43:05.282
37	4	20	540	0	Ivory	92	49680	2026-05-12		t	f	f	2026-05-25 21:44:56.418
38	10	20	40	0	Natural	115	4600	2026-05-04		t	f	f	2026-05-25 21:45:29.241
39	4	21	2000	0	Nyra	133.34	314682	2026-05-21		t	t	f	2026-05-25 21:46:48.242
40	13	21	2000	0	Nyra	133.34	314682	2026-05-21		t	t	f	2026-05-25 21:47:18.885
41	8	21	2000	0	Nyra	133.34	314682	2026-05-21	13	t	t	f	2026-05-25 21:47:52.177
42	8	21	1000	0	Nyra	133.34	157341	2026-05-21	89	t	t	f	2026-05-25 21:48:24.285
43	8	21	1250	0	Nyra	133.34	196677	2026-05-22	13	t	t	f	2026-05-25 21:58:21.196
44	3	21	1750	0	Nyra	133.34	275347	2026-05-22		t	t	f	2026-05-25 21:58:44.789
45	2	21	1000	0	Nyra	133.34	157341	2026-05-22		t	t	f	2026-05-25 21:59:21.925
46	4	21	1500	0	Nyra	133.34	236012	2026-05-22		t	t	f	2026-05-25 21:59:55.604
47	8	24	1000	0	Mas	130	130000	2026-05-21	89	t	f	f	2026-05-25 22:02:53.366
50	26	1	2400	0	80	126.5	358248	2026-05-23		f	t	f	2026-05-28 17:10:10.983
51	2	30	250	0	Natural	64	18880	2026-05-26		f	t	f	2026-05-28 17:11:14.596
52	11	30	250	0	Natural	64	18880	2026-05-27		f	t	f	2026-05-28 17:11:43.871
53	6	1	1038	0	73 * 60	155	175370	2026-04-30	+ 9 %	f	f	f	2026-05-28 17:14:30.366
54	6	1	362	0	120 * 140	160	63133	2026-05-13	+ 9 %	f	f	f	2026-05-28 17:16:00.658
55	6	1	960	0	96 * 80	160	167424	2026-05-21	+9%	f	f	f	2026-05-28 17:18:18.078
56	6	1	500	0	120 * 110	160	87200	2026-05-27	+ 9 %	f	f	f	2026-05-28 17:19:12.19
57	6	1	630	0	120 * 120 	160	109872	2026-05-25	+ 9 %	f	f	f	2026-05-28 17:20:06.499
58	10	32	238.5	0	Milky	115	27428	2026-05-22		f	f	f	2026-06-02 17:03:49.626
59	4	16	300	0	First Colour	92	27600	2026-05-26		t	f	f	2026-06-02 17:04:29.741
60	4	16	500	0	First Colour	92	46000	2026-05-29		t	f	f	2026-06-02 17:04:50.227
61	10	16	600	0	First Colour	92	55200	2026-05-29		t	f	f	2026-06-02 17:05:13.334
62	1	16	575	0	First Colour	92	52900	2026-05-30		t	f	f	2026-06-02 17:05:52.633
63	19	16	1000	0	First Colour	92	92000	2026-06-01		t	f	f	2026-06-02 17:06:30.091
64	11	16	25	0	Black	64	1600	2026-05-28		t	f	f	2026-06-02 17:07:14.28
65	1	13	0	1050	Semi	63	66150	2026-05-18		t	f	f	2026-06-02 17:08:42.264
66	8	13	0	1000	Red 	65	65000	2026-05-18	89	t	f	f	2026-06-02 17:09:05.324
67	3	13	0	1000	Red	65	65000	2026-05-18		t	f	f	2026-06-02 17:09:33.72
68	9	13	0	1000	Red	65	65000	2026-05-18		t	f	f	2026-06-02 17:10:09.863
69	8	13	0	1950	Semi	65	126750	2026-05-20	13	t	f	f	2026-06-02 17:10:48.756
70	1	13	0	1000	Red	65	65000	2026-05-22		t	f	f	2026-06-02 17:11:13.541
71	8	13	0	2100	Cp Semi	65	136500	2026-05-26	13	t	f	f	2026-06-02 17:11:45.011
72	1	13	0	1000	Red	65	65000	2026-05-27		t	f	f	2026-06-02 17:12:06.798
73	9	13	0	1000	Red	65	65000	2026-05-28		t	f	f	2026-06-02 17:12:54.866
74	7	13	0	2000	Red	65	130000	2026-05-29		t	f	f	2026-06-02 17:13:15.98
75	8	13	0	3000	Red	65	195000	2026-05-30	13	t	f	f	2026-06-02 17:13:44.795
76	4	15	500	0	Natural	109	54500	2026-05-27		t	f	f	2026-06-03 18:28:24.215
77	1	33	747.5	0	First Colour	0	0	2026-05-27		f	f	f	2026-06-03 18:44:26.309
78	4	30	350	0	Natural	60	24780	2026-06-02		f	t	f	2026-06-05 16:57:03.753
79	4	30	0	0	Natural	49	17150	2026-06-02	Kachchaa For \ngst In 350 Kg Transaction	f	f	f	2026-06-05 17:03:44.653
80	11	30	900	0	Black	90	95580	2026-06-02		f	t	f	2026-06-05 17:04:32.349
81	11	30	0	0	Black	-12	-10800	2026-06-02	Kachchaa For Gst In 900 Kg Transaction	f	f	f	2026-06-05 17:05:36.979
82	11	30	750	0	Natural	60	53100	2026-06-02		f	t	f	2026-06-05 17:06:19.502
83	11	30	0	0	Natural	49	36750	2026-06-02	Kachchaa For Gst In 750 Kg Transaction	f	f	f	2026-06-05 17:07:35.216
84	11	30	0	0	Natural	45	11250	2026-05-27	Kachchaa For Gst In 250 Kg Transaction	t	f	f	2026-06-05 17:14:56.197
85	2	30	0	0	Natural	45	11250	2026-05-27	Kachchaa For Gst In 250 Kg Transaction	f	f	f	2026-06-05 17:15:39.208
86	4	38	398	0	Unknown	0	0	2026-05-23		f	f	f	2026-06-07 20:55:55.671
87	4	21	3000	0	Nyra	136.37	482750	2026-06-05		f	t	f	2026-06-08 18:39:07.812
88	13	21	2000	0	Nyra	136.37	321833	2026-06-05		f	t	f	2026-06-08 18:39:49.025
89	2	39	200	0	Old Stock	0	0	2026-04-30	9/4 Old Entry	f	f	f	2026-06-12 20:28:15.085
90	19	40	75	0	Styron	126	9450	2026-06-01		t	f	f	2026-06-12 21:02:45.029
91	8	21	4000	0	Nyra	139.37	657826	2026-06-12	13	t	t	f	2026-06-12 21:03:28.437
92	8	21	2000	0	Nyra	139.37	328913	2026-06-12	89	t	t	f	2026-06-12 21:04:00.218
93	3	21	1500	0	Nyra	139.37	246685	2026-06-12		t	t	f	2026-06-12 21:04:24.493
\.


--
-- Data for Name: transactions_out; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions_out (id, jobber_id, vendor_id, type1, type2, material, rate, amount, date, remark, w, b, a, created_at) FROM stdin;
2	3	1	65	0	73 Mm Star Cap	55	3575	2026-05-11		f	f	f	2026-05-26 20:05:43.478
3	3	1	30	0	Small Spoon	68	2040	2026-05-27		f	f	f	2026-05-26 20:09:34.836
4	3	1	80	0	73 Mm Star Cap	55	4400	2026-05-09		f	f	f	2026-05-26 20:11:02.913
5	3	1	20	0	Small Spoon	68	1360	2026-05-09		f	f	f	2026-05-26 20:11:21.029
6	3	1	36	0	73 Mm Star Cap	55	1980	2026-05-15		f	f	f	2026-05-26 20:11:48.565
7	3	1	60	0	73 Mm Star Cap	55	3300	2026-05-21		f	f	f	2026-05-26 20:12:07.217
8	3	1	10	0	Small Spoon	68	680	2026-05-21		f	f	f	2026-05-26 20:12:20.489
9	3	2	10	0	Small Spoon	68	680	2026-05-21		f	f	f	2026-05-26 20:12:44.975
10	3	2	20	0	Big Spoon	31	620	2026-05-22		f	f	f	2026-05-26 20:13:49.062
11	3	1	60	0	73 Mm Star Cap	55	3300	2026-05-23		f	f	f	2026-05-26 20:14:43.827
12	3	1	30	0	Small Spoon	68	2040	2026-05-23		f	f	f	2026-05-26 20:15:04.443
13	3	2	10	0	Big Spoon	31	310	2026-05-25		f	f	f	2026-05-26 20:15:33.267
14	3	4	234.9	0	10kg Cap	1.4	5670	2026-05-25		f	f	f	2026-05-26 20:17:47.719
15	3	5	120.528	0	Orange Jug ( Printed )	3.2	3571	2026-05-02		f	f	f	2026-05-26 20:24:21.117
16	3	5	265.572	0	Orange Jug ( Printed )	3.2	7869	2026-05-04		f	f	f	2026-05-26 20:24:44.346
17	4	6	360	0	53 Mm Cap	33	11880	2026-05-08		f	f	f	2026-05-26 20:51:06.042
18	4	1	8	0	96 Mm ( P )	20	160	2026-05-13		f	f	f	2026-05-26 20:53:28.297
20	4	1	30	0	96 Mm ( P )	20	600	2026-05-15		f	f	f	2026-05-26 20:55:26.688
21	4	2	165	0	96 Mm Star Cap	22	3630	2026-05-18		f	f	f	2026-05-26 20:56:34.924
22	4	4	350	0	7 Kg Cap	0.95	6650	2026-05-21		f	f	f	2026-05-26 21:01:18.827
23	4	1	120	0	73 Mm Cap ( Printed )	27.6	3312	2026-05-24		f	f	f	2026-05-26 22:01:44.841
24	4	2	143	0	96 Mm Star Cap	22	3146	2026-05-25		f	f	f	2026-05-26 22:02:12.069
25	4	2	110	0	Likar Cap	35	3850	2026-05-25		f	f	f	2026-05-26 22:03:26.441
26	4	1	300	0	53 Mm First	33	9900	2026-05-13		f	f	f	2026-05-27 17:19:24.279
27	4	1	132	0	83 Mm First	21	2772	2026-05-15		f	f	f	2026-05-27 17:21:38.369
28	4	1	29	0	120 Mm Cap	32	928	2026-05-19		f	f	f	2026-05-27 17:22:44.187
29	4	1	150	0	73 Mm Ivory	27.6	4140	2026-05-21		f	f	f	2026-05-27 17:24:00.084
30	4	1	75	0	73 Mm Ivory	27.6	2070	2026-05-24		f	f	f	2026-05-27 17:25:00.549
31	4	1	170	0	96 Mm Ivory	20	3400	2026-05-24		f	f	f	2026-05-27 17:26:47.966
32	10	1	204	0	60 Mm Cap	60	12240	2026-05-13		f	f	f	2026-05-27 18:46:50.555
33	10	1	216	0	60 Mm Cap	60	12960	2026-05-16		f	f	f	2026-05-27 18:47:12.759
34	10	1	170	0	60 Mm Cap	60	10200	2026-05-26		f	f	f	2026-05-27 18:47:37.524
35	11	1	97.650	0	96 Mm Big Cap	0.55	1733	2026-05-18		f	f	f	2026-05-27 19:00:18.419
36	11	1	237.6	0	73 Mm Big Cap	0.55	5940	2026-05-26		f	f	f	2026-05-27 19:11:17.223
37	2	4	180	0	Rajwadi 8 Kg Cap	1.25	4500	2026-05-18		f	f	f	2026-05-27 19:48:50.019
38	2	4	248.4	0	Rajwadi 5 Kg Cap	1.25	9000	2026-05-23		f	f	f	2026-05-27 19:49:57.991
39	2	4	67.5	0	Rajwadi 8 Kg Cap	1.25	1688	2026-05-19		f	f	f	2026-05-27 19:50:50.551
40	2	4	44	0	Rajwadi Lock	80	3520	2026-05-19		f	f	f	2026-05-27 19:52:58.201
41	3	4	104.4	0	10kg Cap	1.4	2520	2026-05-27		f	f	f	2026-06-02 17:16:54.94
42	3	4	10	0	Big Spoon	31	310	2026-05-27		f	f	f	2026-06-02 17:18:11.18
43	3	4	10	0	Small Spoon	68	680	2026-05-29		f	f	f	2026-06-02 17:18:27.85
44	4	1	90	0	Likar Cap	35	3150	2026-05-27		f	f	f	2026-06-02 17:22:52.973
45	4	1	84	0	83 Mm First	21	1764	2026-05-27		f	f	f	2026-06-02 17:23:15.87
46	4	1	46	0	83 Mm First	21	966	2026-05-26		f	f	f	2026-06-02 17:23:36.156
47	11	1	158.4	0	73 Mm Big Cap	0.55	3960	2026-05-28		f	f	f	2026-06-02 19:05:01.11
49	3	1	0	874.368	Medium Kunda Plate (doz)	16.7	17635	2026-05-30		f	f	f	2026-06-02 19:31:27.702
50	3	1	1086.72	0	Timtom 44 (doz)	17.3	39167	2026-05-31		f	f	f	2026-06-02 20:00:31.745
51	3	1	0	1003.392	Bulbul Dana Plate With Hanger (doz)	34.4	27658	2026-05-30		f	f	f	2026-06-02 20:02:24.771
52	3	1	0	1089	Pigeon Bowl With Hanger (doz	32.9	24675	2026-05-30		f	f	f	2026-06-02 20:04:27.803
53	3	1	758.52	0	Strawberry Jug (doz)	35.16	25843	2026-05-31		f	f	f	2026-06-02 20:05:51.47
54	3	1	256.608	0	Orange Jug First (doz)	38.4	7603	2026-05-31		f	f	f	2026-06-02 20:07:33.202
55	3	1	129.6	0	Orange Jug Natural (doz)	38.4	3840	2026-05-31		f	f	f	2026-06-02 20:08:46.229
56	4	1	504.144	0	Store King 1000 With Spoon (doz)	17.4	20306	2026-05-31		f	f	f	2026-06-02 20:18:40.422
57	4	1	87	0	Clean India Kharata (pcs)	7.75	5813	2026-05-31		f	f	f	2026-06-02 20:22:06.698
58	4	1	531.36	0	Chiku Basket (doz)	24	17712	2026-05-31		f	f	f	2026-06-02 20:23:32.543
59	4	1	277.704	0	Kalash No.3 Loose (doz)	14.62	8904	2026-05-31		f	f	f	2026-06-02 20:24:56.367
60	4	1	408.24	0	Store King 2000 With Spoon (doz)	21	11907	2026-05-31		f	f	f	2026-06-02 20:26:01.593
61	4	1	365.472	0	Mr. Clean Supdi First (doz)	21	11844	2026-05-31		f	f	f	2026-06-02 20:27:27.266
62	4	1	135	0	Khitti (doz)	17	7650	2026-05-31		f	f	f	2026-06-02 20:28:15.098
63	4	1	356.928	0	Store King 3000 With Spoon (doz)	31	10478	2026-05-31		f	f	f	2026-06-02 20:29:12.765
64	4	1	354.78	0	Lock & Seal 700 With Dabi (doz)	78	17550	2026-05-30		f	f	f	2026-06-02 20:33:01.198
65	4	1	74.844	0	Big Modak Container (doz)	30	2970	2026-05-30		f	f	f	2026-06-02 20:34:24.658
66	4	1	48	0	Medium Papad Printed (doz)	29.5	944	2026-05-31		f	f	f	2026-06-02 20:36:49.48
67	4	1	41.04	0	Medium Papad First (doz)	29.5	885	2026-05-31		f	f	f	2026-06-02 20:38:05.507
68	4	1	25.344	0	Lunch Time Lunch Box (doz)	66	1452	2026-05-31		f	f	f	2026-06-02 20:39:37.233
69	10	1	730.296	0	Stunner Double Mold (doz)	26.4	25502	2026-05-31		f	f	f	2026-06-02 20:42:17.616
70	10	1	208.5	0	Tomato Basket(doz)	26.4	7920	2026-05-31		f	f	f	2026-06-02 20:43:13.624
71	9	1	0	2093.04	6'kunda (doz)	16.8	51408	2026-05-29		f	f	f	2026-06-02 20:45:59.674
72	9	1	411.84	0	Char Minar Cutlary (doz)	26.4	13728	2026-05-31		f	f	f	2026-06-02 20:47:23.322
73	1	1	0	1698.264	8' Kunda Wooden (doz)	25	34350	2026-05-31		f	f	f	2026-06-02 20:49:35.707
74	1	1	812.16	0	Timtom 55 (doz)	22	25344	2026-05-31		f	f	f	2026-06-02 20:52:07.655
75	1	1	0	887.04	8' Tulsi Kunda Wooden (doz)	25	16800	2026-05-31		f	f	f	2026-06-02 20:53:42.896
76	1	1	0	1223.6	Flower Basket Dlx (doz)	42	27048	2026-05-31		f	f	f	2026-06-02 20:55:20.675
77	1	1	0	608.220	3 Ltr. Bucket With Cap (doz)	52	17004	2026-05-31		f	f	f	2026-06-02 20:57:25.691
78	1	1	0	480.48	Matka Stand Dlx (doz)	42	12012	2026-05-31		f	f	f	2026-06-02 20:58:24.534
79	11	1	1079.12	0	Kitchen Basket Dlx (doz)	28.8	27072	2026-05-31		f	f	f	2026-06-02 21:00:24.991
80	11	1	441	0	Anupama Basket Dlx (doz)	28.8	11290	2026-05-31		f	f	f	2026-06-02 21:01:21.954
81	11	1	280.56	0	Timtom 66 (doz)	31.2	8736	2026-05-31		f	f	f	2026-06-02 21:02:20.894
82	2	1	248.4	0	Seltos Mug (doz)	14.4	5184	2026-05-31		f	f	f	2026-06-02 21:04:53.393
83	2	1	175.5	0	Small Hungry Lunch Box (doz)	30	8100	2026-05-31		f	f	f	2026-06-02 21:05:50.565
84	2	1	107.73	0	Double Door Pencil Box (doz)	28	5292	2026-05-31		f	f	f	2026-06-02 21:06:49.835
85	2	1	14.04	0	1600 Dabi (doz)	12	648	2026-05-31		f	f	f	2026-06-02 21:07:55.969
87	7	1	0	3138.96	14' Kunda Wooden (doz)	77.4	49381	2026-05-31		f	f	f	2026-06-02 21:12:30.337
88	7	1	0	1482	16' Kunda Wooden (doz)	126	23940	2026-05-31		f	f	f	2026-06-02 21:13:57.215
89	7	1	0	730.08	Balcony Kunda Big (doz)	120	14040	2026-05-30		f	f	f	2026-06-02 21:15:13.216
90	7	1	0	619.2	20' Kunda (doz)	156	9360	2026-05-31		f	f	f	2026-06-02 21:17:50.807
91	13	1	785.4	0	Store King 15000 (doz)	112.8	21094	2026-05-31		f	f	f	2026-06-02 21:20:40.946
92	8	1	0	3219.216	10' Kunda Wooden (doz)	42	61908	2026-05-30		f	f	f	2026-06-02 21:23:36.72
93	8	1	0	3079.92	12' Kunda Wooden (doz)	72	59040	2026-05-30		f	f	f	2026-06-02 22:19:59.696
94	8	1	1065.816	0	Store King 5000 (doz)	45.6	30917	2026-05-31		f	f	f	2026-06-02 22:22:40.858
95	8	1	939.12	0	Rajwadi 5000 (doz)	54	32508	2026-05-31		f	f	f	2026-06-02 22:24:22.518
96	8	1	1245.42	0	Store King 7000 (doz)	60	33300	2026-05-29		f	f	f	2026-06-02 22:25:45.867
97	8	1	0	1933.8	Pan Tray 3 Dlx (doz)	64.8	37973	2026-05-30		f	f	f	2026-06-02 22:27:46.807
98	8	1	1201.788	0	Store King 10000 (doz)	76.8	30643	2026-05-30		f	f	f	2026-06-02 22:30:35.524
99	8	1	899.808	0	Rajwadi 8000 (doz)	63.6	26203	2026-05-30		f	f	f	2026-06-02 22:34:45.661
100	8	1	0	1989.12	Pan Tray 4 Dlx (doz)	84	31080	2026-05-30		f	f	f	2026-06-02 22:36:07.583
101	19	1	1020.78	0	Small Bite Lunch Box(doz)	37	58830	2026-05-30		f	f	f	2026-06-02 22:38:54.369
102	1	7	388.8	0	15 Kg Cap	1.9	8208	2026-05-27		f	f	f	2026-06-03 18:41:40.375
104	14	1	0	491.355	Pan Tray 1 Dlx (doz)	16	8784	2026-04-30		f	f	f	2026-06-05 16:53:31.56
105	4	1	12	0	83 Mm First	21	252	2026-05-31		f	f	f	2026-06-07 18:13:52.747
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, name, created_at) FROM stdin;
1	Fhp	2026-05-25 22:53:02.758
2	Kp	2026-05-26 20:13:42.763
3	K	2026-05-26 20:13:54.054
4	Lala	2026-05-26 20:17:34.749
5	Bhavin	2026-05-26 20:24:10.224
6	Raju	2026-05-26 20:50:55.109
7	Umiya	2026-06-03 18:41:32.696
\.


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 76, true);


--
-- Name: jobber_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobber_adjustments_id_seq', 23, true);


--
-- Name: jobbers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobbers_id_seq', 26, true);


--
-- Name: material_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_transfers_id_seq', 21, true);


--
-- Name: seller_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seller_adjustments_id_seq', 31, true);


--
-- Name: sellers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sellers_id_seq', 40, true);


--
-- Name: transactions_in_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_in_id_seq', 93, true);


--
-- Name: transactions_out_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_out_id_seq', 105, true);


--
-- Name: vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendors_id_seq', 7, true);


--
-- Name: items items_item_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_name_key UNIQUE (item_name);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: jobber_adjustments jobber_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobber_adjustments
    ADD CONSTRAINT jobber_adjustments_pkey PRIMARY KEY (id);


--
-- Name: jobbers jobbers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobbers
    ADD CONSTRAINT jobbers_name_key UNIQUE (name);


--
-- Name: jobbers jobbers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobbers
    ADD CONSTRAINT jobbers_pkey PRIMARY KEY (id);


--
-- Name: material_transfers material_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_transfers
    ADD CONSTRAINT material_transfers_pkey PRIMARY KEY (id);


--
-- Name: seller_adjustments seller_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_adjustments
    ADD CONSTRAINT seller_adjustments_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_name_key UNIQUE (name);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


--
-- Name: transactions_in transactions_in_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_in
    ADD CONSTRAINT transactions_in_pkey PRIMARY KEY (id);


--
-- Name: transactions_out transactions_out_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_out
    ADD CONSTRAINT transactions_out_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_name_key UNIQUE (name);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: idx_in_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_in_date ON public.transactions_in USING btree (date);


--
-- Name: idx_in_jobber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_in_jobber ON public.transactions_in USING btree (jobber_id);


--
-- Name: idx_out_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_out_date ON public.transactions_out USING btree (date);


--
-- Name: idx_out_jobber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_out_jobber ON public.transactions_out USING btree (jobber_id);


--
-- Name: idx_transfers_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_date ON public.material_transfers USING btree (date);


--
-- Name: idx_transfers_from_jobber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_from_jobber ON public.material_transfers USING btree (from_jobber_id);


--
-- Name: idx_transfers_to_jobber; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transfers_to_jobber ON public.material_transfers USING btree (to_jobber_id);


--
-- Name: jobber_adjustments jobber_adjustments_jobber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobber_adjustments
    ADD CONSTRAINT jobber_adjustments_jobber_id_fkey FOREIGN KEY (jobber_id) REFERENCES public.jobbers(id);


--
-- Name: material_transfers material_transfers_from_jobber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_transfers
    ADD CONSTRAINT material_transfers_from_jobber_id_fkey FOREIGN KEY (from_jobber_id) REFERENCES public.jobbers(id) ON DELETE CASCADE;


--
-- Name: material_transfers material_transfers_to_jobber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.material_transfers
    ADD CONSTRAINT material_transfers_to_jobber_id_fkey FOREIGN KEY (to_jobber_id) REFERENCES public.jobbers(id) ON DELETE CASCADE;


--
-- Name: seller_adjustments seller_adjustments_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seller_adjustments
    ADD CONSTRAINT seller_adjustments_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id);


--
-- Name: transactions_in transactions_in_jobber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_in
    ADD CONSTRAINT transactions_in_jobber_id_fkey FOREIGN KEY (jobber_id) REFERENCES public.jobbers(id) ON DELETE CASCADE;


--
-- Name: transactions_in transactions_in_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_in
    ADD CONSTRAINT transactions_in_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE CASCADE;


--
-- Name: transactions_out transactions_out_jobber_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_out
    ADD CONSTRAINT transactions_out_jobber_id_fkey FOREIGN KEY (jobber_id) REFERENCES public.jobbers(id) ON DELETE CASCADE;


--
-- Name: transactions_out transactions_out_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions_out
    ADD CONSTRAINT transactions_out_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict htjm4LESZOCx2hVFvMirBjnxEy0SUJUc1X6njtsPFAxgmTK4BsSuUyLv8NsdSMZ

