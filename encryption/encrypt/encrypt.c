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

	void ReadHeaderFromFile(FILE* fp, struct file_aes_header_s fh)
	{
		fread(fh.file_type, sizeof(unsigned char), 3, fp);
		fread(fh.skey, sizeof(unsigned char), 48, fp);
		fread(fh.sha256, sizeof(unsigned char), 32, fp);
		fread(fh.iv, sizeof(unsigned char), 16, fp);
	}

void aes_enc_sessionkey(unsigned char* key_in, unsigned char* key_out, aes_encrypt_ctx* ctx)
{
	unsigned char dbuf[3 * BLOCK_LEN];
    unsigned long i;// , wlen = BLOCK_LEN;
    unsigned char* ikey_out = key_out;
    unsigned char* ikey_in = key_in;

	memcpy(key_out, key_in, BLOCK_LEN);
	ikey_out += BLOCK_LEN;

	memcpy(dbuf, key_in, sizeof(unsigned char) * BLOCK_LEN * 2);
	ikey_in += BLOCK_LEN * 2;

	unsigned char *b1 = dbuf, *b2 = b1 + BLOCK_LEN, *b3 = b2 + BLOCK_LEN, *bt;

	memcpy(b3, ikey_in, BLOCK_LEN);
	ikey_in += BLOCK_LEN;

	for(i = 0; i < BLOCK_LEN; ++i)
        b1[i] ^= b2[i];

	aes_encrypt(b1, b1, ctx);

	memcpy(ikey_out, b1, BLOCK_LEN);
	ikey_out += BLOCK_LEN;

	bt = b3, b3 = b2, b2 = b1, b1 = bt;

	for(i = 0; i < BLOCK_LEN; ++i)
        b1[i] ^= b2[i];

	aes_encrypt(b1, b1, ctx);

	memcpy(ikey_out, b1, BLOCK_LEN);
	ikey_out += BLOCK_LEN;
}

void makernd(unsigned char* data, int size){
    srand(time(NULL));
    for (int i = 0; i < size; i++) {
        data[i] = (rand() % 256);
    }


}

int encfile(FILE *fin, FILE *fout, unsigned char *iv, aes_encrypt_ctx ctx[1], unsigned char* sha_result)
{   unsigned char dbuf[3 * BLOCK_LEN];
    unsigned long i, len, wlen = BLOCK_LEN;

    // When ciphertext stealing is used, we need three ciphertext blocks
    // so we use a buffer that is three times the block length.  The buffer
    // pointers b1, b2 and b3 point to the buffer positions of three
    // ciphertext blocks, b3 being the most recent and b1 being the
    // oldest. We start with the IV in b1 and the block to be decrypted
    // in b2.

    // set IV
	memset(dbuf, 0, sizeof(unsigned char) * 3 * BLOCK_LEN);

   	memcpy((void *)dbuf, (void *)iv, sizeof(unsigned char) * BLOCK_LEN);

	SHA256_CTX sha_context;
	sha256_init(&sha_context);

    // read the first file block
    len = (unsigned long) fread((char*)dbuf + BLOCK_LEN, 1, BLOCK_LEN, fin);

	sha256_update(&sha_context, dbuf + BLOCK_LEN, len);

    if(len < BLOCK_LEN)
    {   // if the file length is less than one block

        // xor the file bytes with the IV bytes
        for(i = 0; i < len; ++i)
            dbuf[i + BLOCK_LEN] ^= dbuf[i];

        // encrypt the top 16 bytes of the buffer
        aes_encrypt(dbuf + len, dbuf + len, ctx);

        len += BLOCK_LEN;
        // write the IV and the encrypted file bytes
        if(fwrite((char*)dbuf, 1, len, fout) != len)
            return WRITE_ERROR;

		sha256_final(&sha_context, sha_result);

        return OK;
    }
    else    // if the file length is more 16 bytes
    {   unsigned char *b1 = dbuf, *b2 = b1 + BLOCK_LEN, *b3 = b2 + BLOCK_LEN, *bt;

        // write the IV
        if(fwrite((char*)dbuf, 1, BLOCK_LEN, fout) != BLOCK_LEN)
            return WRITE_ERROR;

        for( ; ; )
        {
            // read the next block to see if ciphertext stealing is needed
            len = (unsigned long)fread((char*)b3, 1, BLOCK_LEN, fin);
	        
            sha256_update(&sha_context, b3, len);

            // do CBC chaining prior to encryption for current block (in b2)
            for(i = 0; i < BLOCK_LEN; ++i)
                b1[i] ^= b2[i];

            // encrypt the block (now in b1)
            aes_encrypt(b1, b1, ctx);

            if(len != 0 && len != BLOCK_LEN)    // use ciphertext stealing
            {
                // set the length of the last block
                wlen = len;

                // xor ciphertext into last block
                for(i = 0; i < len; ++i)
                    b3[i] ^= b1[i];

                // move 'stolen' ciphertext into last block
                for(i = len; i < BLOCK_LEN; ++i)
                    b3[i] = b1[i];

                // encrypt this block
                aes_encrypt(b3, b3, ctx);

                // and write it as the second to last encrypted block
                if(fwrite((char*)b3, 1, BLOCK_LEN, fout) != BLOCK_LEN)
                    return WRITE_ERROR;
            }

            // write the encrypted block
            if(fwrite((char*)b1, 1, wlen, fout) != wlen)
                return WRITE_ERROR;

            if(len != BLOCK_LEN){
                sha256_final(&sha_context, sha_result);
                return OK;
            }

            // advance the buffer pointers
            bt = b3, b3 = b2, b2 = b1, b1 = bt;
        }
    }
}

int printkey(unsigned char *pkey, int size){
    int ret = 0, i;
    for(i=0;i<size;i++){
        printf("%X",pkey[i]);
    }

    return ret;
}

int loadkey(char *kfile, unsigned char ekey[]){
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


int main(int argc, char *argv[]) {
    char input_file[_MAX_FNAME] = "";
    char output_file[_MAX_FNAME] = "";
    char *key_input = NULL;
    unsigned char key[KEY_SIZE];
    unsigned char sessionkey[KEY_SIZE];
    // unsigned char sbuff[KEY_SIZE + 16];
    int got_key = 0, got_in = 0, got_out = 0, err = 0;
    struct file_aes_header_s cfh;

    
    FILE *fin = 0, *fout = 0;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-i") == 0 || strcmp(argv[i], "--input") == 0) {
            if (i + 1 < argc) {
                strcpy(input_file,argv[i + 1]);
                got_in = 1;
                // input_file = argv[i + 1];
                i++;
            } else {
                printf("Error: Input file name missing\n");
                exit(1);
            }
        } else if (strcmp(argv[i], "-o") == 0 || strcmp(argv[i], "--output") == 0) {
            if (i + 1 < argc) {
                strcpy(output_file,argv[i + 1]);
                got_out = 1;
                // output_file = argv[i + 1];
                i++;
            } else {
                printf("Error: Output file name missing\n");
                exit(1);
            }
        } else if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
                printf("Usage: %s [-i,--input <filename>] [-o,--output <filename>] [-k,--key <hex_key>]\n", argv[0]);
                exit(1);
        } else if (strcmp(argv[i], "-k") == 0 || strcmp(argv[i], "--key") == 0) {
            if (i + 1 < argc) {
                key_input = argv[i + 1];

                int key_len = strlen(key_input);

                if(key_len != 64){
                    printf("Error: Key must be 64 hex values\n");
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
                printf("Error: Key input missing\n");
                exit(1);
            }
        } else {
            printf("Error: Unknown option '%s'\n", argv[i]);
            exit(1);
        }
    }

    if (got_key == 0){
        char *prog_dir = dirname(argv[0]);
        char key_path[256];
        snprintf(key_path, sizeof(key_path), "%s/default.key", prog_dir);
        if (loadkey(key_path,key) != 0 ){
          printf("Error: Missing Encryption Key\n");
          exit(1);          
        }
        else
        {
            printf("Loaded Default.key\n");
        }
        


    }

    if (got_in == 0) {
        printf("Error: Input file name missing\n");
        exit(1);
    }

    if (got_out == 0) {
        sprintf(output_file,"%s.aes",input_file);
    }

    printf("Encrypting %s \nto %s now...\n",input_file,output_file);

    if(fopen_s(&fin, input_file, "rb"))   // try to open the input file
    {
        printf("The input file: %s could not be opened\n", argv[1]);
        err = -5; goto exit;
    }

    if(fopen_s(&fout, output_file, "wb"))  // try to open the output file
    {
        printf("The output file: %s could not be opened\n", argv[2]);
        err = -6; goto exit;
    }
    aes_init();     // in case dynamic AES tables are being used

    makernd(cfh.skey,48);
    makernd(cfh.iv,16);
    memcpy(sessionkey,cfh.skey + 16, 32);

    printf("\n\nkey = ");
    printkey(key,32);
    printf("\nsessionkey = ");
    printkey(sessionkey,32);
    printf("\n\n");

    aes_encrypt_ctx skctx[1];

    aes_encrypt_key((unsigned char*)key, 32, skctx);

    aes_enc_sessionkey(cfh.skey,cfh.skey,skctx);


    WriteHeaderToFile(fout,cfh);
    fflush(fout);


    aes_encrypt_ctx ctx[1];

        aes_encrypt_key((unsigned char*)sessionkey, 32, ctx);

        err = encfile(fin, fout, cfh.iv, ctx, cfh.sha256);

        if (fseek(fout, 0, SEEK_SET) == 0)
        {
            WriteHeaderToFile(fout,cfh);
            fflush(fout);
        }

exit:
    if(err == READ_ERROR){
        printf("Error reading from input file: %s\n", argv[1]);
    }else if(err == WRITE_ERROR){
        printf("Error writing to output file: %s\n", argv[2]);
    }
    else
    {
        printf("Compilation successful\n");
    }
    
    if(fout)
        fclose(fout);

    if(fin)
        fclose(fin);

    return err;
}
