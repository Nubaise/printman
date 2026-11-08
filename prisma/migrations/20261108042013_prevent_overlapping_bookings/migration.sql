CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
ADD CONSTRAINT "bookings_no_overlapping_slots"
EXCLUDE USING GIST (
    "printer_id" WITH =,
    (
        tsrange(
            "booking_date" + "start_time",
            "booking_date" + "end_time",
            '[)'
        )
    ) WITH &&
)
WHERE ("status" <> 'CANCELLED');
