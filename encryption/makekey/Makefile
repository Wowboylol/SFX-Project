CC = gcc
CFLAGS = -Wall -Werror

all: makekey

random_hex: random_hex.c
	$(CC) $(CFLAGS) -o makekey makekey.c

clean:
	rm -f makekey
