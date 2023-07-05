The utils zip file contains the encryption functions needed to encrypt / decrypt the files you wish to send. The source code for these functions is in the encryption folder. 

This utility contains 

makekey : 	Outputs a random 64 character hex key (2^256 bit key)
 
createkeyfile : 	Create a ‘default.key’ file in the same folder as the createkeyfile executable that is loaded by default if encrypt or decrypt do not have a key specified using -k flag.
 
encrypt : 	Encrypts the input file(which is required) and if no output file is specified, the output file just appends ‘.aes’ to the input file name. If no key is specified, ‘default.key’ is attempted to be loaded.
 
decrypt : 	Decrypts the input file to the output file(which is just the input file name minus the ‘.aes, unless specified). ‘default key’ is used unless it is specified.
 
convertkey : 	Convertkey decrypts the session key in the input file using the inkey and then encrypts the session key using the outkey and outputs the encrypted file to the output file name.
 
