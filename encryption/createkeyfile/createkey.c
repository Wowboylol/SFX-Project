#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <libgen.h>
#include <unistd.h>

#define KEY_SIZE 32
#define HEADER "AESKEY"

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("To create a default encryption key you must include the full encryption key.\n\n");
        printf("Usage: %s <hex-string>\n", argv[0]);
        return 1;
    }

    char *hex_str = argv[1];
    int hex_len = strlen(hex_str);
    if (hex_len  != 64) {
        printf("Error: Encryption key Hex string must have all 64 characters.\n");
        return 1;
    }

    unsigned char key[KEY_SIZE];
    int i, j;
    for (i = 0, j = 0; i < hex_len; i += 2, j++) {
        char hex_byte[3];
        hex_byte[0] = hex_str[i];
        hex_byte[1] = hex_str[i+1];
        hex_byte[2] = '\0';
        key[j] = strtol(hex_byte, NULL, 16);
    }

    char *prog_dir = dirname(argv[0]);
    char key_path[256];
    snprintf(key_path, sizeof(key_path), "%s/default.key", prog_dir);

    FILE *key_file = fopen(key_path, "wb");
    if (key_file == NULL) {
        printf("Error: Unable to create key file.\n");
        return 1;
    }

    fwrite(HEADER, strlen(HEADER), 1, key_file);
    fwrite(key, KEY_SIZE, 1, key_file);

    fclose(key_file);

    printf("Key successfully written to file '%s'.\n", key_path);

    return 0;
}
