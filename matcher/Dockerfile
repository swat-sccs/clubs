FROM golang:1.26.4-alpine3.22 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /matcher .

FROM alpine:3.22.5
RUN addgroup -S matcher && adduser -S -G matcher matcher
COPY --from=build --chown=matcher:matcher /matcher /matcher
USER matcher
EXPOSE 8080
CMD ["/matcher"]
