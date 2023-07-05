/*
---------------------------------------------------------------------------
Copyright (c) 1998-2013, Brian Gladman, Worcester, UK. All rights reserved.

The redistribution and use of this software (with or without changes)
is allowed without the payment of fees or royalties provided that:

  source code distributions include the above copyright notice, this
  list of conditions and the following disclaimer;

  binary distributions include the above copyright notice, this list
  of conditions and the following disclaimer in their documentation.

This software is provided 'as is' with no explicit or implied warranties
in respect of its operation, including, but not limited to, correctness
and fitness for purpose.
---------------------------------------------------------------------------
Issue Date: 25/09/2018
*/

//  An example of the use of AES (Rijndael) for file encryption.  This code
//  implements AES in CBC mode with ciphertext stealing when the file length
//  is greater than one block (16 bytes).  This code is an example of how to
//  use AES and is not intended for real use since it does not provide any
//  file integrity checking.
//
//  The Command line is:
//
//      aesxam input_file_name output_file_name [D|E] hexadecimalkey
//
//  where E gives encryption and D decryption of the input file into the
//  output file using the given hexadecimal key string.  The later is a
//  hexadecimal sequence of 32, 48 or 64 digits.  Examples to encrypt or
//  decrypt aes.c into aes.enc are:
//
//      aesxam file.c file.enc E 0123456789abcdeffedcba9876543210
//
//      aesxam file.enc file2.c D 0123456789abcdeffedcba9876543210
//
//  which should return a file 'file2.c' identical to 'file.c'
//
//  CIPHERTEXT STEALING
//
//  Ciphertext stealing modifies the encryption of the last two CBC
//  blocks. It can be applied invariably to the last two plaintext
//  blocks or only applied when the last block is a partial one. In
//  this code it is only applied if there is a partial block.  For
//  a plaintext consisting of N blocks, with the last block possibly
//  a partial one, ciphertext stealing works as shown below (note the
//  reversal of the last two ciphertext blocks).  During decryption
//  the part of the C:N-1 block that is not transmitted (X) can be
//  obtained from the decryption of the penultimate ciphertext block
//  since the bytes in X are xored with the zero padding appended to
//  the last plaintext block.
//
//  This is a picture of the processing of the last
//  plaintext blocks during encryption:
//
//    +---------+   +---------+   +---------+   +-------+-+
//    |  P:N-4  |   |  P:N-3  |   |  P:N-2  |   | P:N-1 |0|
//    +---------+   +---------+   +---------+   +-------+-+
//         |             |             |             |
//         v             v             v             v
//  +----->x      +----->x      +----->x      +----->x   x = xor
//  |      |      |      |      |      |      |      |
//  |      v      |      v      |      v      |      v
//  |    +---+    |    +---+    |    +---+    |    +---+
//  |    | E |    |    | E |    |    | E |    |    | E |
//  |    +---+    |    +---+    |    +---+    |    +---+
//  |      |      |      |      |      |      |      |
//  |      |      |      |      |      v      |  +---+
//  |      |      |      |      | +-------+-+ |  |
//  |      |      |      |      | | C:N-1 |X| |  |
//  |      |      |      |      | +-------+-+ ^  |
//  |      |      |      |      |     ||      |  |
//  |      |      |      |      |     |+------+  |
//  |      |      |      |      |     +----------|--+
//  |      |      |      |      |                |  |
//  |      |      |      |      |      +---------+  |
//  |      |      |      |      |      |            |
//  |      v      |      v      |      v            v
//  | +---------+ | +---------+ | +---------+   +-------+
// -+ |  C:N-4  |-+ |  C:N-3  |-+ |  C:N-2  |   | C:N-1 |
//    +---------+   +---------+   +---------+   +-------+
//
//  And this is a picture of the processing of the last
//  ciphertext blocks during decryption:
//
//    +---------+   +---------+   +---------+   +-------+
// -+ |  C:N-4  |-+ |  C:N-3  |-+ |  C:N-2  |   | C:N-1 |
//  | +---------+ | +---------+ | +---------+   +-------+
//  |      |      |      |      |      |            |
//  |      v      |      v      |      v   +--------|----+
//  |    +---+    |    +---+    |    +---+ |  +--<--+    |
//  |    | D |    |    | D |    |    | D | |  |     |    |
//  |    +---+    |    +---+    |    +---+ |  |     v    v
//  |      |      |      |      |      |   ^  | +-------+-+
//  |      v      |      v      |      v   |  | | C:N-1 |X|
//  +----->x      +----->x      | +-------+-+ | +-------+-+
//         |             |      | |       |X| |      |
//         |             |      | +-------+-+ |      v
//         |             |      |     |       |    +---+
//         |             |      |     |       v    | D |
//         |             |      |     +------>x    +---+
//         |             |      |             |      |
//         |             |      +----->x<-----|------+   x = xor
//         |             |             |      +-----+
//         |             |             |            |
//         v             v             v            v
//    +---------+   +---------+   +---------+   +-------+
//    |  P:N-4  |   |  P:N-3  |   |  P:N-2  |   | P:N-1 |
//    +---------+   +---------+   +---------+   +-------+

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <libgen.h>
#include <unistd.h>
#include <time.h>
#include "aesopt.h"
#include "sha256.h"

#define KEY_SIZE 32

#define BLOCK_LEN   16

#define OK           0
#define READ_ERROR  -7
#define WRITE_ERROR -8

struct file_aes_header_s
{
	unsigned char file_type[3];
	unsigned char skey[48];
	unsigned char sha256[32];
	unsigned char iv[16];


};
// typedef aes_header file_aes_header_s;

	int isAESFile(struct file_aes_header_s fh) 
	{
		return (fh.file_type[0] == 'A' && fh.file_type[1] == 'E' && fh.file_type[2] == 'S');
	}

	void WriteHeaderToFile(FILE* fp, struct file_aes_header_s fh)
	{
        fwrite("AES",sizeof(unsigned char), 3, fp);
		fwrite(fh.skey, sizeof(unsigned char), 48, fp);
		fwrite(fh.sha256, sizeof(unsigned char), 32, fp);
		fwrite(fh.iv, sizeof(unsigned char), 16, fp);
	}

	void ReadHeaderFromFile(FILE* fp, struct file_aes_header_s *fh)
	{
		fread(fh->file_type, sizeof(unsigned char), 3, fp);
		fread(fh->skey, sizeof(unsigned char), 48, fp);
		fread(fh->sha256, sizeof(unsigned char), 32, fp);
		fread(fh->iv, sizeof(unsigned char), 16, fp);
	}

void aes_enc_sessionkey(unsigned char* key_in, unsigned char* key_out, aes_encrypt_ctx* ctx)
{
	unsigned char dbuf[3 * BLOCK_LEN];
    unsigned long i;// , wlen = BLOCK_LEN;

	memcpy(key_out, key_in, BLOCK_LEN);
	key_out += BLOCK_LEN;

	memcpy(dbuf, key_in, sizeof(unsigned char) * BLOCK_LEN * 2);
	key_in += BLOCK_LEN * 2;

	unsigned char *b1 = dbuf, *b2 = b1 + BLOCK_LEN, *b3 = b2 + BLOCK_LEN, *bt;

	memcpy(b3, key_in, BLOCK_LEN);
	key_in += BLOCK_LEN;

	for(i = 0; i < BLOCK_LEN; ++i)
        b1[i] ^= b2[i];

	aes_encrypt(b1, b1, ctx);

	memcpy(key_out, b1, BLOCK_LEN);
	key_out += BLOCK_LEN;

	bt = b3, b3 = b2, b2 = b1, b1 = bt;

	for(i = 0; i < BLOCK_LEN; ++i)
        b1[i] ^= b2[i];

	aes_encrypt(b1, b1, ctx);

	memcpy(key_out, b1, BLOCK_LEN);
	key_out += BLOCK_LEN;
}

void aes_dec_sessionkey(unsigned char* key_in, unsigned char* key_out, aes_decrypt_ctx* ctx)
{
	unsigned char dbuf[3 * BLOCK_LEN], buf[BLOCK_LEN];
    unsigned long i;//, wlen = BLOCK_LEN;

	memcpy(dbuf, key_in, 2 * BLOCK_LEN);
	key_in += 2 * BLOCK_LEN;

	unsigned char *b1 = dbuf, *b2 = b1 + BLOCK_LEN, *b3 = b2 + BLOCK_LEN, *bt;

	memcpy(b3, key_in, BLOCK_LEN);
	aes_decrypt(b2, buf, ctx);

	for(i = 0; i < BLOCK_LEN; ++i)
		buf[i] ^= b1[i];

	memcpy(key_out, buf, BLOCK_LEN);
	key_out += BLOCK_LEN;
	
	bt = b1, b1 = b2, b2 = b3, b3 = bt;

	aes_decrypt(b2, buf, ctx);

	for(i = 0; i < BLOCK_LEN; ++i)
		buf[i] ^= b1[i];

	memcpy(key_out, buf, BLOCK_LEN);
}


void makernd(unsigned char* data, int size){
    srand(time(NULL));
    for (int i = 0; i < size; i++) {
        data[i] = (rand() % 256);
    }


}



int loadkey(char *kfile,unsigned char ekey[]){
    int ret = 0;
	FILE *fp = NULL;
	unsigned char file_type[6];

    
 	if ((fp = fopen( kfile, "r+b" )) != NULL)
	{
		fread(file_type, sizeof(unsigned char), 6, fp);
        if (file_type[0] == 'A' && file_type[1] == 'E' && file_type[2] == 'S' && file_type[3] == 'K' && file_type[4] == 'E' && file_type[5] == 'Y'){
		    fread(ekey, sizeof(unsigned char), 32, fp);

        }
        else {
            ret = -1;
        }

    }
    else
    {
        ret = -1;
    }
		fclose(fp);



    return ret;
}

int printkey(unsigned char *pkey, int size){
    int ret = 0, i;
    for(i=0;i<size;i++){
        printf("%X",pkey[i]);
    }

    return ret;
}

int main(int argc, char *argv[]) {
    char input_file[_MAX_FNAME] = "";
    char output_file[_MAX_FNAME] = "";
	// unsigned char ofsha256[32];
    char *key_input = NULL;
    char *key_output = NULL;
    unsigned char key[KEY_SIZE];
    unsigned char outkey[KEY_SIZE];
    unsigned char sessionkey[KEY_SIZE];
    // unsigned char sbuff[KEY_SIZE + 16];
    int got_key = 0, got_okey = 0, got_in = 0, got_out = 0, err = 0;
    struct file_aes_header_s cfh;
	unsigned char fbuffer[64001];

    
    FILE *fin = 0, *fout = 0;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-i") == 0 || strcmp(argv[i], "--input") == 0) {
            if (i + 1 < argc) {
                strcpy(input_file,argv[i + 1]);
                got_in = 1;
                i++;
            } else {
                printf("Error: Input file name missing\n");
                exit(1);
            }
        } else if (strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0) {
            if (i + 1 < argc) {
                strcpy(output_file,argv[i + 1]);
                got_out = 1;
                i++;
            } else {
                printf("Error: Output file name missing\n");
                exit(1);
            }
        } else if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
                printf("Usage: %s [-i,--input <filename>] [-o,--output <filename>] [-ik,--inkey <hex_key>] [-ok,--outkey <hex_key>]\n", argv[0]);
                exit(1);
        } else if (strcmp(argv[i], "-ik") == 0 || strcmp(argv[i], "--inkey") == 0) {
            if (i + 1 < argc) {
                key_input = argv[i + 1];

                int key_len = strlen(key_input);

                if(key_len != 64){
                    printf("Error: Input Key must be 64 hex values\n");
                    exit(1);                    
                }
                i++;

                int x, y;
                for (x = 0, y = 0; x < key_len; x += 2, y++) {
                    char hex_byte[3];
                    hex_byte[0] = key_input[x];
                    hex_byte[1] = key_input[x+1];
                    hex_byte[2] = '\0';
                    key[y] = strtol(hex_byte, NULL, 16);
                }
                got_key = 1;               
            } else {
                printf("Error: Input Key input missing\n");
                exit(1);
            }
        } else if (strcmp(argv[i], "-ok") == 0 || strcmp(argv[i], "--outkey") == 0) {
            if (i + 1 < argc) {
                key_output = argv[i + 1];

                int okey_len = strlen(key_output);

                if(okey_len != 64){
                    printf("Error: Output Key must be 64 hex values\n");
                    exit(1);                    
                }
                i++;

                int x, y;
                for (x = 0, y = 0; x < okey_len; x += 2, y++) {
                    char hex_byte[3];
                    hex_byte[0] = key_output[x];
                    hex_byte[1] = key_output[x+1];
                    hex_byte[2] = '\0';
                    outkey[y] = strtol(hex_byte, NULL, 16);
                }
                got_okey = 1;               
            } else {
                printf("Error: Output Key input missing\n");
                exit(1);
            }
        } else {
            printf("Error: Unknown option '%s'\n", argv[i]);
            exit(1);
        }
    }

    if (got_key == 0){
        printf("Error: Input key missing\n");
        printf("\nUsage: %s [-i,--input <filename>] [-o,--output <filename>] [-ik,--inkey <hex_key>] [-ok,--outkey <hex_key>]\n", argv[0]);
        exit(1);

    }

    if (got_okey == 0){
        printf("Error: Output key missing\n");
        printf("\nUsage: %s [-i,--input <filename>] [-o,--output <filename>] [-ik,--inkey <hex_key>] [-ok,--outkey <hex_key>]\n", argv[0]);
        exit(1);

    }

    if (got_in == 0) {
        printf("Error: Input file name missing\n");
        printf("\nUsage: %s [-i,--input <filename>] [-o,--output <filename>] [-ik,--inkey <hex_key>] [-ok,--outkey <hex_key>]\n", argv[0]);
        exit(1);
    }

    if (got_out == 0) {
        printf("Error: Output file name missing\n");
        printf("\nUsage: %s [-i,--input <filename>] [-o,--output <filename>] [-ik,--inkey <hex_key>] [-ok,--outkey <hex_key>]\n", argv[0]);
        exit(1);
    }

    if(fopen_s(&fin, input_file, "rb"))   // try to open the input file
    {
        printf("The input file: %s could not be opened\n", input_file);
        err = READ_ERROR; goto exit;
    }

    if(fopen_s(&fout, output_file, "wb"))  // try to open the output file
    {
        printf("The output file: %s could not be opened\n", output_file);
        err = WRITE_ERROR; goto exit;
    }
    aes_init();     // in case dynamic AES tables are being used

    ReadHeaderFromFile(fin,&cfh);
    if(isAESFile(cfh) == 0){
        printf("The input file: %s is not an AES encrypted file\n", input_file);
        err = -99; goto exit;
    }


    aes_decrypt_ctx skctx[1];

    aes_decrypt_key((unsigned char*)key, 32, skctx);

    aes_dec_sessionkey(cfh.skey,sessionkey,skctx);
    memcpy(cfh.skey+16,sessionkey,32);

    printf("Convertkey %s \nto %s \nInput key = ",input_file,output_file);
    printkey(key,32);
    printf("\nOukey = ");
    printkey(outkey,32);
    printf("\nsessionkey = ");
    printkey(sessionkey,32);
    printf("\n\n");

    aes_encrypt_ctx oskctx[1];

    aes_encrypt_key((unsigned char*)outkey, 32, oskctx);

    aes_enc_sessionkey(cfh.skey,cfh.skey,oskctx);

    WriteHeaderToFile(fout,cfh);

    unsigned long flen=0;
    for(;;){
        // read the next block 
        flen = (unsigned long)fread((char*)fbuffer, 1, 64000, fin);
        if (flen > 0){
                if(fwrite((char*)fbuffer, 1, flen, fout) != flen){
                    err = WRITE_ERROR; goto exit;
                }

        }else{
            break;
        }
	        
    }
    fflush(fout);

exit:
    if(err == READ_ERROR){
        printf("Error reading from input file: %s\n", input_file);
    }else if(err == WRITE_ERROR){
        printf("Error writing to output file: %s\n", output_file);
    }else if(err == -99){
        printf("Error wrong file type: %s\n", input_file);    
    }else if(err == -88){
        printf("Hash failed for file: %s\n", output_file);
        printf("Likely used the wrong encryption key\n");
    }else
    {
        printf("Compilation successful\n");
    }
    
    if(fout)
        fclose(fout);

    if(fin)
        fclose(fin);

    return err;
}
