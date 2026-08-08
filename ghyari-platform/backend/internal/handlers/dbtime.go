package handlers

import (
	"fmt"
	"time"
)

// dbTime scans a SQLite TEXT datetime column (e.g. the output of
// datetime('now'), which looks like "2006-01-02 15:04:05") into a
// time.Time. database/sql only auto-converts a driver-native time.Time
// value; scanning a TEXT/blob column straight into *time.Time otherwise
// fails with "unsupported Scan". Use dbTime as the Scan destination, then
// call .Time() to get a time.Time for the model.
type dbTime time.Time

var dbTimeLayouts = []string{
	time.RFC3339,
	"2006-01-02 15:04:05.999999999-07:00",
	"2006-01-02 15:04:05",
	"2006-01-02",
}

func (t *dbTime) Scan(src interface{}) error {
	if src == nil {
		return nil
	}
	var s string
	switch v := src.(type) {
	case string:
		s = v
	case []byte:
		s = string(v)
	case time.Time:
		*t = dbTime(v)
		return nil
	default:
		return fmt.Errorf("dbTime: unsupported Scan type %T", src)
	}
	for _, layout := range dbTimeLayouts {
		if parsed, err := time.Parse(layout, s); err == nil {
			*t = dbTime(parsed)
			return nil
		}
	}
	return fmt.Errorf("dbTime: cannot parse %q as a timestamp", s)
}

func (t dbTime) Time() time.Time { return time.Time(t) }

// formatSQLTime renders a time.Time for storage in a TEXT datetime column,
// in the same "YYYY-MM-DD HH:MM:SS" shape SQLite's own datetime('now')
// produces. Passing a bare time.Time as a query argument must be avoided:
// the sqlite driver stringifies it with Go's default time.Time formatting,
// which (for a time.Now() value) includes the monotonic clock reading
// ("... m=+36.085...") and produces a value dbTime.Scan can't parse back.
func formatSQLTime(t time.Time) string {
	return t.UTC().Format("2006-01-02 15:04:05")
}
