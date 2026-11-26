#pragma once

#include "Modules/ModuleManager.h"

class FFabelbattlerModule : public IModuleInterface
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
};
