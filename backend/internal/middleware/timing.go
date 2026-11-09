package middleware

import (
	"context"
	"net/http"
	"time"
)

type contextKey string

const StartTimeKey contextKey = "requestStartTime"

func RequestTimer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), StartTimeKey, time.Now())
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

