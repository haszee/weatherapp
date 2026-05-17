CREATE TABLE "exports_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"format" varchar(10) NOT NULL,
	"record_ids" integer[],
	"row_count" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"location" text NOT NULL,
	"country" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "date_range_check" CHECK ("requests_log"."date_from" <= "requests_log"."date_to")
);
--> statement-breakpoint
CREATE TABLE "weather_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"request_id" integer NOT NULL,
	"date" date,
	"temp_c" numeric(5, 2),
	"feels_like_c" numeric(5, 2),
	"humidity" smallint,
	"wind_speed_ms" numeric(6, 2),
	"precip_probability" numeric(5, 2),
	"uv_index" numeric(4, 2),
	"aqi" smallint,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "requests_log" ADD CONSTRAINT "requests_log_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_request_id_requests_log_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exports_created" ON "exports_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_locations_query" ON "locations" USING btree (LOWER("query"));--> statement-breakpoint
CREATE INDEX "idx_requests_created" ON "requests_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_records_location_date" ON "weather_records" USING btree ("location_id","date");--> statement-breakpoint
CREATE INDEX "idx_records_created" ON "weather_records" USING btree ("created_at");