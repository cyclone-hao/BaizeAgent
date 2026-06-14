import PluginPage from '@/app/components/plugins/plugin-page'
import PluginsPanel from '@/app/components/plugins/plugin-page/plugins-panel'

const PluginList = () => {
  return (
    <PluginPage
      plugins={<PluginsPanel />}
    />
  )
}

export default PluginList
