const os = require('os')
const cp = require('child_process')

var convertkey = (inkey,infile,outkey,outfile) => {
    if (os.platform =='win32'){
        cp.execFile("convertkey.exe",["-ik",inkey,"-i",infile,"-ok",outkey,"-o",outfile], function(err,stdout,stderr){
            console.log(stdout)
        })
    }
    else if(os.platform == 'linux'){
        cp.execFile("./src/convertkey",["-ik",inkey,"-i",infile,"-ok",outkey,"-o",outfile], function(err,stdout,stderr){
            console.log(stdout)
        })
    }
    else if(os.platform == 'darwin'){
        cp.execFile("./src/convertkey",["-ik",inkey,"-i",infile,"-ok",outkey,"-o",outfile], function(err,stdout,stderr){
            console.log(stdout)
        })
    }
    else{
        console.log(`can't run on ${os.platform}, ${os.release}`)
    }
}

module.exports = {
    convertkey
}