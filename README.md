A basic SQLite3 database handler for the TwinCAT Eventlogger. Exports data as .xlsx and .pdf. 
Require libreoffice to be installed.  

Made changes in node_modules libreoffice-convert index.js accordingly to this issue
https://github.com/elwerene/libreoffice-convert/issues/32

Code for line 46 - 53

convert: ['soffice', 'saveSource', (results, callback) => {
    let command = `--headless --convert-to ${format}`;
    if (filter !== undefined) {
        command += `:"${filter}"`;
    }
    command += ` --outdir ${tempDir.name} ${path.join(tempDir.name, 'source')}`;
    const args = command.split(' ');
    return execFile(results.soffice, args, callback);
}],

