import sys
from pathlib import Path
from pkgutil import iter_modules

submodules = []
package_dir = Path(__file__).resolve().parent.__str__()
for (_, module_name, _) in iter_modules([package_dir]):
    __import__(f'{__name__}.{module_name}')
    submodules.append(getattr(sys.modules[__name__], module_name))
    print(f' * Loaded Blueprint: {module_name}')
