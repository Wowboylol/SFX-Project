#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(void) {
    const int length = 64;
    const char hex_chars[] = "0123456789ABCDEF";
    char hex_string[length + 1];

    srand(time(NULL));

    for (int i = 0; i < length; i++) {
        hex_string[i] = hex_chars[rand() % 16];
    }

    hex_string[length] = '\0';

    printf("%s\n", hex_string);

    return 0;
}
