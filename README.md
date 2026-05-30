
# How to run this app on Windows OS

## Part 1/3: Lauching the backend BLE server
1) Open Windows Powershell with admin privilege, clone this repo, and cd to this repo's directory
```
git clone https://github.com/erlichlab/optogrid-manager.git
cd optogrid-manager
```

2) Install Python 3.12.4 (64-bit)
- Download the installer from https://www.python.org/downloads/windows/ 
- Install Python 3.12.4 using the installer, with Customize Installation:
    - Use admin privileges when installing py.exe
    - Add python.exe to PATH
    - Enable the "py" launcher (for all users)

3) Verify installation:
```powershell
py -3.12 -V
```

4) Create a virtual environment
```powershell
py -3.12 -m venv optogrid-manager
```

5) Activate the environment
```powershell
optogrid-manager\Scripts\activate
```
- If your windows doesn't allow scripts execution, then allow it first, then activate
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
optogrid-manager\Scripts\activate
```

6) Install dependencies
```powershell
pip install -r requirements.txt
```

7) Run the python backend BLE server
```powershell
python headless_optogrid_backend.py
```
## Part 2/3: Lauching the web-based GUI application
1) Install Node.js from official website, **LTS** version recommended 
```
https://nodejs.org/en/download
```
2) Verify Node installation in Windows Powershell
```powershell
node -v
```
It should return version number. If command not found, then you need to debug the installation

3) Launch the Web Application in Windws Powershell
```powershell 
node dashboard/server.js
```

4) Use a browser access the app via the following URL

If viewing from the same machine
```
localhost:3000
```
If viewing from other machine in the same local network, use the URL following "Network Access" printed in the Powershell window, for example:
```
172.10.158.222:3000
```
## Part 3/3: Guide for using the Web GUI to interface with OptoGrid device
[View GUI Guide (PDF)](GUI_guide.pdf)

## Purpose

This repository is to share the Optogrid Manager application with OpenEphys for testing. Its license is set to "All Rights Reserved" for now until device distribution begins. 