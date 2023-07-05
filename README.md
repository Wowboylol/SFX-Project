## Checkpoint - Current Features:
The application currently has login and registration features. At the moment, no front-end framework is used and html forms are used to make calls to our database. The login searches for an existing document in our Mongo database, while registering adds a document.

Now that our server code can interact with the database, we will switch over to an Angular front-end to implement our next components and improve the UI of the application.

Some features are being worked on but have not yet been connected together. These include the Angular front-end, database schemas for file storage, encyption and decryption programs.

All the encryption utilities have been developed and are in the utils folder. These handle encrypting and decrypting files.


## Secure File Exchange System
A web-based encrypted file exchange system is a powerful tool that enables users to securely transfer files between each other without worrying about potential data breaches or unauthorized access. This system uses advanced encryption techniques to ensure that data is protected at all times, and only authorized users can access it.

The system uses 256 bit Advanced Encryption Standard (AES) encryption, which is one of the most secure encryption algorithms currently available. AES is a symmetric key encryption algorithm that uses the same key for both encryption and decryption, making it fast and efficient. The system generates a unique session key for each file that is being transferred, and this key is used to encrypt the file data. The session key is also encrypted in the header of the encrypted file using the user's key, making it virtually impossible for anyone to decrypt the file without the user's permission.

To use the web-based encrypted file exchange system, users must first log in using their user ID and password. Once logged in, the system verifies their credentials and grants access to their encrypted files. Each user has their own AES key, which is used to encrypt and decrypt their files. This key is stored securely in the system, and only the user can access it.

When a user wants to transfer a file to another user, they encrypt and upload the file to the system and specify the recipient's user ID. The system then retrieves the recipient's AES key and uses it to encrypt the session key for the file. The encrypted file, along with the encrypted session key, is then sent to the recipient. When the recipient receives the file, they use their AES key to decrypt the session key, which is then used to decrypt the file on their own computer.

The web-based encrypted file exchange system offers several benefits over traditional file transfer methods. First, the system provides end-to-end encryption, which means that data is encrypted on the sender's computer, in transit, and on the recipient's computer. This ensures that data is protected at all times, even if it is intercepted during transit.

Second, the system is easy to use and does not require any special software or plugins to be installed. Users can access the system from any web browser, making it convenient and accessible. They only need the utilities to encrypt and then decrypt on their computer.

Third, the system offers strong authentication and access control mechanisms. Users must log in with their user ID and password, and their credentials are verified before they are granted access to their encrypted files. This ensures that only authorized users can access sensitive data.

In conclusion, the web-based encrypted file exchange system using AES encryption with each encrypted file using a session key that is encrypted in the header of the encrypted file with the user's key is a powerful tool that enables users to securely transfer files between each other. The system offers end-to-end encryption, strong authentication and access control mechanisms, and is easy to use. The system is ideal for users that need to exchange sensitive data with other users.
