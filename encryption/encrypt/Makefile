CC = gcc
CFLAGS = -Wall -Werror
OBJFILES = encrypt.o aescrypt.o aeskey.o aestab.o sha256.o

all: encrypt

encrypt: $(OBJFILES)
	$(CC) -o encrypt $(OBJFILES)

encrypt.o: encrypt.c aes.h aesopt.h sha256.h
	$(CC) $(CFLAGS) -c encrypt.c

aescrypt.o: aescrypt.c aes.h aesopt.h
	$(CC) $(CFLAGS) -c aescrypt.c

aeskey.o: aeskey.c aes.h aesopt.h
	$(CC) $(CFLAGS) -c aeskey.c

aestab.o: aestab.c aes.h aesopt.h
	$(CC) $(CFLAGS) -c aestab.c

sha256.o: sha256.c sha256.h
	$(CC) $(CFLAGS) -c sha256.c

clean:
	rm -f *.o encrypt
