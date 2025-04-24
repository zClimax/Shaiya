

#include "StdAfx.h"
HANDLE m_DllModule;

extern  "C"  __declspec(dllexport) void __cdecl ShaiyaAyris()  
{	
	ClassName.Feature  = 1;															
	
}
BOOL APIENTRY DllMain( HMODULE hModule,
					  DWORD ul_reason_for_call,
					  LPVOID lpReserved ) {

						      switch (ul_reason_for_call)
						      {
						      case DLL_PROCESS_ATTACH:
							  m_DllModule = hModule;

							  ShaiyaAyris();
								
							  if (ClassName.Feature == 1)
							  {
								// -- Discord Rpc -- //
								  Discord();						
				
							  }
					
								 
						  break;
						  case DLL_THREAD_ATTACH:
						  case DLL_THREAD_DETACH:
						  case DLL_PROCESS_DETACH:
							  break;
						  }
						  return TRUE;
}


